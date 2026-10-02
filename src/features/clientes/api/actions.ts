'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  ROLES_AGENDA,
  registrarEnAuditoria,
  requerirStaff,
  type Resultado,
} from '@/features/calendario/api/comunes'
import { filasDeCliente, normalizarTelefono, type FilaContacto } from './queries'

/**
 * Gestión de un cliente del CRM (Habeas Data, Ley 1581 de 2012): corregir sus
 * datos de contacto (rectificación) o suprimirlo con todo su historial
 * (supresión). No existe tabla `clients`: el cliente ES el grupo de reservas y
 * tickets que comparten su clave de contacto, así que ambas acciones localizan
 * las filas re-derivando la clave con los MISMOS helpers de queries.ts y
 * actúan sobre ese grupo completo. Mismos guardas que el calendario:
 * `requerirStaff(ROLES_AGENDA)` + Zod + auditoría en audit_log (el rastro que
 * demuestra el cumplimiento). Las mutaciones van con el cliente de sesión
 * (RLS "staff all"); los payments dependientes de un DELETE se van solos por
 * la FK on delete cascade.
 */

/** Clave de agrupación tal como la deriva queries.ts: `email:…`/`tel:…`/`nombre:…`. */
const claveSchema = z.string().regex(/^(email|tel|nombre):.+$/, 'Cliente inválido')

/** Correo opcional: vacío/null se guarda como null; si se da, debe ser válido. */
const emailOpcional = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ?? '').trim())
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido')
  .transform((v) => (v === '' ? null : v))

/** Teléfono opcional: vacío/null se guarda como null; si no, queda trimado. */
const telefonoOpcional = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ?? '').trim())
  .transform((v) => (v === '' ? null : v))

const editarClienteSchema = z.object({
  clave: claveSchema,
  nombre: z.string().trim().min(1, 'El nombre no puede quedar vacío'),
  email: emailOpcional,
  telefono: telefonoOpcional,
})

const eliminarClienteSchema = z.object({ clave: claveSchema })

/** Mensaje de fallo de Zod (el primero), como en calendario/api/gestion.ts. */
function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos inválidos'
}

/**
 * Contacto vigente de las filas de un cliente — mismo criterio que
 * getClientes: cronológico ascendente y el dato más reciente no vacío gana.
 * Es el "antes" que se audita al rectificar.
 */
function contactoDe(filas: FilaContacto[]): {
  nombre: string
  email: string | null
  telefono: string | null
} {
  let nombre = ''
  let email: string | null = null
  let telefono: string | null = null
  for (const fila of filas) {
    if (fila.nombre?.trim()) nombre = fila.nombre.trim()
    if (fila.email?.trim()) email = fila.email.trim()
    if (normalizarTelefono(fila.telefono)) telefono = (fila.telefono ?? '').trim()
  }
  return { nombre, email, telefono }
}

/**
 * Corrige nombre/correo/teléfono de un cliente (rectificación): aplica el
 * MISMO triple de contacto a todas sus reservas y tickets (las que comparten
 * su clave), así el grupo sigue consolidándose como un solo cliente — el
 * corregido. Vaciar correo o teléfono los limpia también en todo el grupo.
 */
export async function editarCliente(input: unknown): Promise<Resultado> {
  const parsed = editarClienteSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const { clave, ...cambios } = parsed.data

  const { reservas, tickets } = await filasDeCliente(supabase, clave)
  if (reservas.length === 0 && tickets.length === 0) {
    return { success: false, error: 'No se encontró el cliente' }
  }

  if (reservas.length > 0) {
    const { error } = await supabase
      .from('reservations')
      .update(cambios)
      .in('id', reservas.map((fila) => fila.id))
    if (error) return { success: false, error: `No se pudo editar el cliente: ${error.message}` }
  }
  if (tickets.length > 0) {
    const { error } = await supabase
      .from('tickets')
      .update(cambios)
      .in('id', tickets.map((fila) => fila.id))
    if (error) return { success: false, error: `No se pudo editar el cliente: ${error.message}` }
  }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'cliente.editar',
    entity: 'cliente',
    entityId: clave,
    summary: {
      clave,
      antes: contactoDe([...reservas, ...tickets]),
      despues: cambios,
      registros: { reservas: reservas.length, tickets: tickets.length },
    },
  })

  revalidatePath('/admin/clientes')
  return { success: true }
}

/**
 * Supresión definitiva de un cliente (Habeas Data): borra TODAS sus reservas
 * y tickets (los que comparten su clave); sus pagos caen solos por la FK on
 * delete cascade. La auditoría conserva la evidencia del cumplimiento (qué
 * clave, cuántos registros) SIN copiar los datos personales suprimidos.
 */
export async function eliminarCliente(input: unknown): Promise<Resultado> {
  const parsed = eliminarClienteSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const { clave } = parsed.data

  const { reservas, tickets } = await filasDeCliente(supabase, clave)
  if (reservas.length === 0 && tickets.length === 0) {
    return { success: false, error: 'No se encontró el cliente' }
  }

  if (reservas.length > 0) {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .in('id', reservas.map((fila) => fila.id))
    if (error) return { success: false, error: `No se pudo eliminar el cliente: ${error.message}` }
  }
  if (tickets.length > 0) {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .in('id', tickets.map((fila) => fila.id))
    if (error) return { success: false, error: `No se pudo eliminar el cliente: ${error.message}` }
  }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'cliente.eliminar',
    entity: 'cliente',
    entityId: clave,
    summary: {
      clave,
      registros_eliminados: { reservas: reservas.length, tickets: tickets.length },
      pagos: 'eliminados en cascada con sus reservas y pasadías',
      fundamento: 'Habeas Data (Ley 1581 de 2012): derecho de supresión',
    },
  })

  revalidatePath('/admin/clientes')
  return { success: true }
}
