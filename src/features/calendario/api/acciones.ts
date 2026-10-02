'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/core/adapters/supabase/server'
import { esFechaISOValida, habitacionesLibres, type HabitacionLibre } from './dia'

/**
 * Creación desde el día del calendario (R3): reservas de alojamiento y
 * pasadías. La verdad final del no-cruce y del cupo vive en la BD:
 *  - restricción de exclusión de reservations → error 23P01 al cruzar;
 *  - trigger de cupo de tickets → excepción P0001 con mensaje CUPO_AGOTADO:.
 * Este código solo filtra la UI (ofrecer habitaciones libres) y TRADUCE
 * esos errores a mensajes claros; nunca los reimplementa.
 */

/**
 * Roles que gestionan la agenda (crear reservas y pasadías desde el calendario):
 * dueño, admin, gerente, comercial y recepción. Cocina y anfitrión quedan fuera
 * de la creación de reservas (operan otras superficies). Alinea el panel con el
 * diseño de roles del propietario.
 */
const ROLES_AGENDA = ['owner', 'admin', 'gerente', 'comercial', 'recepcion']

/** Resultado uniforme para las acciones llamadas desde los formularios. */
type Resultado = { success: true } | { success: false; error: string }

const fechaISO = z
  .string({ required_error: 'La fecha es obligatoria' })
  .refine(esFechaISOValida, 'Fecha inválida (se espera YYYY-MM-DD)')

const crearReservaSchema = z
  .object({
    room_id: z.string().uuid('Habitación inválida'),
    llegada: fechaISO,
    salida: fechaISO,
    adultos: z.coerce
      .number({ invalid_type_error: 'Los adultos deben ser un número' })
      .int('Los adultos deben ser un número entero')
      .min(1, 'Debe haber al menos 1 adulto')
      .max(50, 'Cantidad de adultos fuera de rango'),
    ninos: z.coerce
      .number({ invalid_type_error: 'Los niños deben ser un número' })
      .int('Los niños deben ser un número entero')
      .min(0, 'Los niños no pueden ser negativos')
      .max(50, 'Cantidad de niños fuera de rango'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
    telefono: z.string().trim().min(1, 'El teléfono es obligatorio').max(40),
    // Opcional: vacío → null (el saldo "por definir" se maneja en otra pieza).
    valor_total: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
      z
        .number({ invalid_type_error: 'El valor total debe ser un número' })
        .min(0, 'El valor total no puede ser negativo')
        .nullable(),
    ),
  })
  .refine((d) => d.llegada < d.salida, {
    message: 'La salida debe ser posterior a la llegada',
    path: ['salida'],
  })

const crearPasadiaSchema = z.object({
  fecha: fechaISO,
  plan: z.string().trim().min(1, 'Elige un plan de pasadía'),
  personas: z.coerce
    .number({ invalid_type_error: 'Las personas deben ser un número' })
    .int('Las personas deben ser un número entero')
    .min(1, 'Debe haber al menos 1 persona')
    .max(200, 'Cantidad de personas fuera de rango'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  telefono: z.string().trim().min(1, 'El teléfono es obligatorio').max(40),
})

const rangoLibreSchema = z
  .object({ checkIn: fechaISO, checkOut: fechaISO })
  .refine((d) => d.checkIn < d.checkOut, {
    message: 'La salida debe ser posterior a la llegada',
  })

/**
 * Revalidación de permisos EN SERVIDOR, antes de actuar (patrón de
 * features/usuarios/api/actions.ts): vuelve a leer la sesión y el perfil del
 * actor con el cliente de sesión (RLS) y aborta si no tiene el rol.
 */
async function requerirStaff(rolesPermitidos: readonly string[]) {
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
async function registrarEnAuditoria(
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

/** Código público único: prefijo + 6 caracteres sin ambigüedades. */
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generarCodigo(prefijo: string): string {
  let sufijo = ''
  for (let i = 0; i < 6; i++) {
    sufijo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)]
  }
  return `${prefijo}-${sufijo}`
}

/** Revalida la vista Mes y la página del día donde se creó la reserva. */
function revalidarCalendario(fecha: string) {
  revalidatePath('/admin/calendario')
  revalidatePath(`/admin/calendario/dia/${fecha}`)
}

/** Habitaciones libres para un rango, para el selector del formulario. */
export async function consultarHabitacionesLibres(
  checkIn: unknown,
  checkOut: unknown,
): Promise<HabitacionLibre[]> {
  const parsed = rangoLibreSchema.safeParse({ checkIn, checkOut })
  if (!parsed.success) return []

  // Solo lectura; con sesión activa (el layout ya redirige sin sesión).
  const {
    data: { user },
  } = await (await createClient()).auth.getUser()
  if (!user) return []

  return habitacionesLibres(parsed.data.checkIn, parsed.data.checkOut)
}

/**
 * Crea una reserva de alojamiento confirmada. Devuelve error legible si la
 * habitación se cruzó (23P01 de la restricción de exclusión de la BD).
 */
export async function crearReservaAlojamiento(input: unknown): Promise<Resultado> {
  const parsed = crearReservaSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data

  // Uniques de codigo pueden chocar por azar: pocos reintentos alcanzan.
  const MAX_INTENTOS = 3
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const codigo = generarCodigo('R')

    const { error } = await supabase.from('reservations').insert({
      codigo,
      room_id: d.room_id,
      during: `[${d.llegada},${d.salida})`, // llegada inclusiva, salida exclusiva
      adultos: d.adultos,
      ninos: d.ninos,
      nombre: d.nombre,
      telefono: d.telefono,
      estado: 'confirmada',
      valor_total: d.valor_total,
    })

    if (!error) {
      await registrarEnAuditoria(supabase, {
        actorId: userId,
        actorEmail,
        action: 'reserva.crear',
        entity: 'reservation',
        entityId: codigo,
        summary: {
          codigo,
          room_id: d.room_id,
          llegada: d.llegada,
          salida: d.salida,
          adultos: d.adultos,
          ninos: d.ninos,
          valor_total: d.valor_total,
        },
      })
      revalidarCalendario(d.llegada)
      return { success: true }
    }

    // Solape real: la restricción de exclusión (exclusion_violation) es la
    // verdad final. Se traduce, no se reimplementa.
    if (error.code === '23P01') {
      return {
        success: false,
        error: 'La habitación ya está ocupada en esas fechas. Elige otra habitación o cambia las fechas.',
      }
    }

    if (error.code === '23505' && intento < MAX_INTENTOS) continue // codigo repetido

    return { success: false, error: `No se pudo guardar la reserva: ${error.message}` }
  }

  return { success: false, error: 'No se pudo generar un código único para la reserva' }
}

/**
 * Emite un ticket de pasadía con total calculado (personas × precio del plan).
 * Devuelve error legible si el trigger de cupo de la BD lo rechaza (P0001 /
 * mensaje CUPO_AGOTADO).
 */
export async function crearPasadia(input: unknown): Promise<Resultado> {
  const parsed = crearPasadiaSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data

  const { data: plan, error: errorPlan } = await supabase
    .from('pass_products')
    .select('id, nombre, precio_persona_muestra')
    .eq('slug', d.plan)
    .eq('is_sample', false)
    .maybeSingle()

  if (errorPlan) {
    return { success: false, error: `No se pudo consultar el plan: ${errorPlan.message}` }
  }
  if (!plan) return { success: false, error: 'El plan de pasadía elegido no existe' }

  const precio = Number(plan.precio_persona_muestra)
  const total = Math.round(d.personas * precio * 100) / 100

  const MAX_INTENTOS = 3
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const codigo = generarCodigo('PD')

    const { error } = await supabase.from('tickets').insert({
      codigo,
      fecha: d.fecha,
      personas: d.personas,
      addons: [],
      total_muestra: total,
      nombre: d.nombre,
      telefono: d.telefono,
      estado: 'emitido',
    })

    if (!error) {
      await registrarEnAuditoria(supabase, {
        actorId: userId,
        actorEmail,
        action: 'pasadia.crear',
        entity: 'ticket',
        entityId: codigo,
        summary: {
          codigo,
          fecha: d.fecha,
          plan: d.plan,
          personas: d.personas,
          total_muestra: total,
        },
      })
      revalidarCalendario(d.fecha)
      return { success: true }
    }

    // El trigger enforce_ticket_capacity serializa por fecha y aborta con
    // raise exception 'CUPO_AGOTADO:...' errcode P0001. Se traduce.
    if (error.code === 'P0001' || (error.message ?? '').includes('CUPO_AGOTADO')) {
      return { success: false, error: 'No hay cupo de pasadías para ese día' }
    }

    if (error.code === '23505' && intento < MAX_INTENTOS) continue // codigo repetido

    return { success: false, error: `No se pudo emitir la pasadía: ${error.message}` }
  }

  return { success: false, error: 'No se pudo generar un código único para la pasadía' }
}
