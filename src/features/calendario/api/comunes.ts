import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/core/adapters/supabase/server'
import { createAdminClient } from '@/core/adapters/supabase/admin'
import { esFechaISOValida } from './dia'

/**
 * Guardas compartidos por las acciones del calendario (acciones.ts y grupos.ts
 * crean; gestion.ts edita/cancela/elimina). Vive FUERA de los archivos
 * 'use server' porque exporta valores no-función (esquemas, roles, tipos): un
 * 'use server' solo puede exportar funciones async. Desde grupos.ts (grupos:
 * casa llena y grupal) también se comparten la maquinaria de abonos/comprobantes
 * y el generador de códigos, que antes vivían privados en acciones.ts.
 */

/**
 * Roles que gestionan la agenda (crear reservas y pasadías desde el calendario):
 * dueño, admin, gerente, comercial y recepción. Cocina y anfitrión quedan fuera
 * de la creación de reservas (operan otras superficies). Alinea el panel con el
 * diseño de roles del propietario.
 */
export const ROLES_AGENDA = ['owner', 'admin', 'gerente', 'comercial', 'recepcion']

/**
 * Resultado uniforme para las acciones llamadas desde los formularios.
 * `aviso` comunica un éxito parcial (la reserva se creó pero el abono no
 * alcanzó a registrarse): la UI lo muestra en lugar de cerrar y perderlo.
 */
export type Resultado = { success: true; aviso?: string } | { success: false; error: string }

export const fechaISO = z
  .string({ required_error: 'La fecha es obligatoria' })
  .refine(esFechaISOValida, 'Fecha inválida (se espera YYYY-MM-DD)')

/**
 * Revalidación de permisos EN SERVIDOR, antes de actuar (patrón de
 * features/usuarios/api/actions.ts): vuelve a leer la sesión y el perfil del
 * actor con el cliente de sesión (RLS) y aborta si no tiene el rol.
 */
export async function requerirStaff(rolesPermitidos: readonly string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Sesión no encontrada')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role, activo')
    .eq('id', user.id)
    .single()

  const autorizado =
    Boolean(perfil?.activo) &&
    (rolesPermitidos as readonly string[]).includes((perfil?.role as string) ?? '')

  if (!autorizado) throw new Error('No tienes permiso para hacer este cambio en el calendario')

  return { supabase, userId: user.id, email: user.email ?? '' }
}

/**
 * Auditoría con el cliente de sesión: la policy "audit_log: staff insert"
 * vuelve a validar en la BD que el actor es staff. Sin .select() (gotcha del
 * proyecto): el entity_id es el código único de la fila creada.
 */
export async function registrarEnAuditoria(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campos: {
    actorId: string
    actorEmail: string
    action: string
    entity: string
    entityId: string
    summary: Record<string, unknown>
  },
) {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: campos.actorId,
    actor_email: campos.actorEmail,
    action: campos.action,
    entity: campos.entity,
    entity_id: campos.entityId,
    summary: campos.summary,
  })

  if (error) throw new Error(`Error al registrar en auditoría: ${error.message}`)
}

/** Revalida la vista Mes y la página del día donde se hizo el cambio. */
export function revalidarCalendario(fecha: string) {
  revalidatePath('/admin/calendario')
  revalidatePath(`/admin/calendario/dia/${fecha}`)
}

/**
 * Correo del CLIENTE (opcional): ausente, vacío o solo espacios → null (la
 * columna es nullable); si viene, debe ser un email válido. Se guarda en
 * reservations.email / tickets.email.
 */
export const emailClienteSchema = z.preprocess(
  (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v),
  z.string().trim().email('El correo electrónico no es válido').nullable(),
)

/**
 * Abono registrado junto con la creación (R3.1a): solo MONTO y MEDIO; la
 * subida de comprobante es la pieza siguiente. payments es append-only
 * (0020: staff select/insert, sin update ni delete) y la BD exige monto > 0
 * y un único destino (check XOR): Zod los anticipa con mensajes claros.
 */
const MEDIOS_ABONO = ['efectivo', 'transferencia', 'datáfono', 'otro'] as const

export const abonoSchema = z.object({
  monto: z.coerce
    .number({ invalid_type_error: 'El monto del abono debe ser un número' })
    .positive('El monto del abono debe ser mayor a 0')
    .max(999_999_999, 'El monto del abono excede el máximo permitido'),
  medio: z.enum(MEDIOS_ABONO, { message: 'Elige un medio de pago válido' }),
})

/** Comprobante de pago: imagen o PDF, máximo 5 MB. Guardado en bucket privado. */
const COMPROBANTE_TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const COMPROBANTE_MAX_BYTES = 5 * 1024 * 1024

/**
 * Extrae el File del comprobante del input crudo (antes de Zod, que lo descarta).
 * Lo busca anidado en `abono.comprobante` (flujo de crear) y también a nivel
 * raíz en `comprobante` (flujo de abono sobre reserva/pasadía existente).
 */
export function extraerComprobante(input: unknown): File | null {
  const obj = input as { comprobante?: unknown; abono?: { comprobante?: unknown } }
  const posible = obj?.abono?.comprobante ?? obj?.comprobante
  return posible instanceof File && posible.size > 0 ? posible : null
}

/**
 * Sube el comprobante al bucket privado 'comprobantes' con service-role (tras
 * revalidar staff en quien llama). Devuelve la ruta guardada o un mensaje de error.
 * El bucket es privado: se ve solo por URL firmada (urlComprobante).
 */
async function subirComprobante(
  file: File,
  codigoDestino: string,
): Promise<{ path?: string; error?: string }> {
  if (!COMPROBANTE_TIPOS.includes(file.type)) {
    return { error: 'El comprobante debe ser imagen (JPG/PNG/WEBP) o PDF' }
  }
  if (file.size > COMPROBANTE_MAX_BYTES) {
    return { error: 'El comprobante supera el máximo de 5 MB' }
  }
  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${codigoDestino}/${Date.now()}.${ext}`
  const admin = createAdminClient()
  const { error } = await admin.storage
    .from('comprobantes')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { error: `No se pudo subir el comprobante: ${error.message}` }
  return { path }
}

/** Código público único: prefijo + 6 caracteres sin ambigüedades. */
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generarCodigo(prefijo: string): string {
  let sufijo = ''
  for (let i = 0; i < 6; i++) {
    sufijo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)]
  }
  return `${prefijo}-${sufijo}`
}

/**
 * Inserta el abono en payments y lo audita (`abono.registrar`). Solo INSERT:
 * la tabla es append-only. Devuelve null si quedó registrado, o el mensaje de
 * error para que quien llama decida cómo informarlo (el destino ya existe).
 * El entity_id de la auditoría es el código del destino: la fila de payments
 * no tiene un código legible y no se hace .select() solo para auditar.
 */
export async function insertarAbonoYAuditar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actor: { id: string; email: string },
  destino: { reservationId?: string; ticketId?: string; codigo: string },
  abono: { monto: number; medio: string },
  comprobante?: File | null,
): Promise<string | null> {
  // Comprobante opcional: se sube primero para guardar su ruta en el pago.
  let comprobantePath: string | null = null
  if (comprobante) {
    const subida = await subirComprobante(comprobante, destino.codigo)
    if (subida.error) return subida.error
    comprobantePath = subida.path ?? null
  }

  const { error } = await supabase.from('payments').insert({
    reservation_id: destino.reservationId ?? null,
    ticket_id: destino.ticketId ?? null,
    monto: abono.monto,
    medio: abono.medio,
    comprobante_path: comprobantePath,
    actor_id: actor.id,
    actor_email: actor.email,
  })

  if (error) return error.message

  await registrarEnAuditoria(supabase, {
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'abono.registrar',
    entity: 'payment',
    entityId: destino.codigo,
    summary: {
      destino: destino.reservationId ? 'reserva' : 'pasadia',
      codigo_destino: destino.codigo,
      monto: abono.monto,
      medio: abono.medio,
      con_comprobante: Boolean(comprobantePath),
    },
  })

  return null
}
