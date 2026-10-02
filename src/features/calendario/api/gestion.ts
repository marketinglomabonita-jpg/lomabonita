'use server'

import { z } from 'zod'
import {
  ROLES_AGENDA,
  fechaISO,
  registrarEnAuditoria,
  requerirStaff,
  revalidarCalendario,
  type Resultado,
} from './comunes'

/**
 * Gestión de reservas y pasadías EXISTENTES (R5): editar fechas/habitación,
 * cancelar por estado y eliminar de verdad (limpieza de datos de prueba).
 * Mismos guardas que la creación: `requerirStaff(ROLES_AGENDA)` + Zod +
 * auditoría en audit_log. El no-cruce lo sigue garantizando la BD (la
 * restricción de exclusión lanza 23P01 y aquí solo se traduce); el cupo se
 * libera solo porque el trigger cuenta `estado <> 'cancelado'`.
 *
 * Cancelar NO borra: la reserva pasa a 'cancelada' (deja de ocupar porque la
 * exclusión solo mira solicitada/confirmada) y el ticket a 'cancelado'. Las
 * mutaciones van con el cliente de sesión (RLS "staff all"); los payments
 * dependientes de un DELETE se van solos por la FK on delete cascade.
 */

const idReservaSchema = z.object({ id: z.string().uuid('Reserva inválida') })
const idTicketSchema = z.object({ id: z.string().uuid('Pasadía inválida') })

const editarReservaSchema = z
  .object({
    id: z.string().uuid('Reserva inválida'),
    room_id: z.string().uuid('Habitación inválida'),
    llegada: fechaISO,
    salida: fechaISO,
  })
  .refine((d) => d.llegada < d.salida, {
    message: 'La salida debe ser posterior a la llegada',
    path: ['salida'],
  })

/** Mensaje de fallo de Zod (el primero) o el genérico, como en acciones.ts. */
function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos inválidos'
}

/**
 * Edita fechas y/o habitación de una reserva existente. El formulario de
 * edición manda el trio completo (fechas y habitación prefijadas con los
 * valores actuales): sin ambigüedad de qué conservar. La BD vuelve a validar
 * el no-cruce con la restricción de exclusión (23P01) — un rango que cruce
 * otra reserva activa se rechaza sin romper nada.
 */
export async function editarReserva(input: unknown): Promise<Resultado> {
  const parsed = editarReservaSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data

  // Estado actual: audituar el antes y revalidar también el día de origen.
  const { data: actual } = await supabase
    .from('reservations')
    .select('codigo, room_id, during')
    .eq('id', d.id)
    .maybeSingle()

  if (!actual) return { success: false, error: 'No se encontró la reserva' }

  // Solo reservas activas: una cancelada no participa de la exclusión y un
  // UPDATE sobre ella "lograría" mover fechas de una reserva muerta.
  const { data: editada, error } = await supabase
    .from('reservations')
    .update({ room_id: d.room_id, during: `[${d.llegada},${d.salida})` })
    .eq('id', d.id)
    .in('estado', ['solicitada', 'confirmada'])
    .select('id')
    .maybeSingle()

  if (error) {
    if (error.code === '23P01') {
      return {
        success: false,
        error: 'Ese cambio cruza otra reserva: la habitación ya está ocupada en esas fechas. Elige otra habitación o cambia las fechas.',
      }
    }
    return { success: false, error: `No se pudo editar la reserva: ${error.message}` }
  }
  if (!editada) {
    const estado = await estadoActual('reservations', supabase, d.id)
    return estado === null
      ? { success: false, error: 'No se encontró la reserva' }
      : { success: false, error: `Solo se editan reservas activas (estado actual: ${estado})` }
  }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'reserva.editar',
    entity: 'reservation',
    entityId: actual.codigo ?? d.id,
    summary: {
      codigo: actual.codigo,
      antes: { room_id: actual.room_id, during: actual.during },
      despues: { room_id: d.room_id, llegada: d.llegada, salida: d.salida },
    },
  })

  // Revalidar el día viejo y el nuevo (la vista Mes siempre).
  const llegadaAnterior = actual.during.slice(1, 11)
  revalidarCalendario(llegadaAnterior)
  if (d.llegada !== llegadaAnterior) revalidarCalendario(d.llegada)

  return { success: true }
}

/**
 * Cancela una reserva (estado 'cancelada'): libera la habitación sin borrar
 * historial. Idempotente: si ya estaba cancelada devuelve éxito con aviso y
 * no vuelve a auditar (nada cambió).
 */
export async function cancelarReserva(input: unknown): Promise<Resultado> {
  const parsed = idReservaSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const id = parsed.data.id

  // El .in evita "revivir" o retocar filas ya cerradas; si no matchea ninguna
  // activa se distingue entre "ya cancelada" (aviso) y "no existe" (error).
  const { data, error } = await supabase
    .from('reservations')
    .update({ estado: 'cancelada' })
    .eq('id', id)
    .in('estado', ['solicitada', 'confirmada'])
    .select('codigo, during')
    .maybeSingle()

  if (error) return { success: false, error: `No se pudo cancelar la reserva: ${error.message}` }
  if (!data) {
    const estado = await estadoActual('reservations', supabase, id)
    return estado === null
      ? { success: false, error: 'No se encontró la reserva' }
      : { success: true, aviso: `La reserva ya no está activa (estado: ${estado})` }
  }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'reserva.cancelar',
    entity: 'reservation',
    entityId: data.codigo ?? id,
    summary: { codigo: data.codigo, during: data.during, estado_final: 'cancelada' },
  })

  revalidarCalendario(data.during.slice(1, 11))
  return { success: true }
}

/**
 * Elimina una reserva DE VERDAD (DELETE), para limpiar datos de prueba. Sus
 * payments se borran solos por la FK on delete cascade; los archivos de
 * comprobante del bucket no se tocan (queda su limpieza manual si hace falta).
 */
export async function eliminarReserva(input: unknown): Promise<Resultado> {
  const parsed = idReservaSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const id = parsed.data.id

  const { data: actual } = await supabase
    .from('reservations')
    .select('codigo, room_id, during, estado')
    .eq('id', id)
    .maybeSingle()

  if (!actual) return { success: false, error: 'No se encontró la reserva' }

  const { error } = await supabase.from('reservations').delete().eq('id', id)
  if (error) return { success: false, error: `No se pudo eliminar la reserva: ${error.message}` }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'reserva.eliminar',
    entity: 'reservation',
    entityId: actual.codigo ?? id,
    summary: {
      codigo: actual.codigo,
      room_id: actual.room_id,
      during: actual.during,
      estado: actual.estado,
    },
  })

  revalidarCalendario(actual.during.slice(1, 11))
  return { success: true }
}

/**
 * Cancela un ticket de pasadía (estado 'cancelado'): el trigger de cupo deja
 * de contarlo y el cupo del día se libera solo. Idempotente como la reserva.
 */
export async function cancelarTicket(input: unknown): Promise<Resultado> {
  const parsed = idTicketSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const id = parsed.data.id

  const { data, error } = await supabase
    .from('tickets')
    .update({ estado: 'cancelado' })
    .eq('id', id)
    .neq('estado', 'cancelado')
    .select('codigo, fecha, personas')
    .maybeSingle()

  if (error) return { success: false, error: `No se pudo cancelar la pasadía: ${error.message}` }
  if (!data) {
    const estado = await estadoActual('tickets', supabase, id)
    return estado === null
      ? { success: false, error: 'No se encontró la pasadía' }
      : { success: true, aviso: 'La pasadía ya estaba cancelada' }
  }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'pasadia.cancelar',
    entity: 'ticket',
    entityId: data.codigo ?? id,
    summary: { codigo: data.codigo, fecha: data.fecha, personas: data.personas },
  })

  revalidarCalendario(data.fecha)
  return { success: true }
}

/** Elimina un ticket DE VERDAD (DELETE), con sus payments por la FK cascade. */
export async function eliminarTicket(input: unknown): Promise<Resultado> {
  const parsed = idTicketSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const id = parsed.data.id

  const { data: actual } = await supabase
    .from('tickets')
    .select('codigo, fecha, personas, estado')
    .eq('id', id)
    .maybeSingle()

  if (!actual) return { success: false, error: 'No se encontró la pasadía' }

  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) return { success: false, error: `No se pudo eliminar la pasadía: ${error.message}` }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail,
    action: 'pasadia.eliminar',
    entity: 'ticket',
    entityId: actual.codigo ?? id,
    summary: {
      codigo: actual.codigo,
      fecha: actual.fecha,
      personas: actual.personas,
      estado: actual.estado,
    },
  })

  revalidarCalendario(actual.fecha)
  return { success: true }
}

/**
 * Desambigua un update sin filas: relee sin el filtro de estado y devuelve el
 * estado real (null si la fila no existe), para que quien llama distinga
 * "ya estaba cerrada" (éxito con aviso, sin auditar de nuevo) de "no existe".
 */
async function estadoActual(
  tabla: 'reservations' | 'tickets',
  supabase: Awaited<ReturnType<typeof requerirStaff>>['supabase'],
  id: string,
): Promise<string | null> {
  const { data } = await supabase.from(tabla).select('estado').eq('id', id).maybeSingle()
  return data?.estado ?? null
}
