'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/core/adapters/supabase/server'
import {
  checkInTicketSchema,
  setCapacitySchema,
  CAPACIDAD_DEFAULT_PASADIA,
  type Ticket,
  type PassCapacity,
  type CapacityRow,
} from '../contracts/types'

// ============================================================================
// Tickets
// ============================================================================

export async function listTickets(filtro?: { estado?: string; fecha?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (filtro?.estado) {
    query = query.eq('estado', filtro.estado)
  }
  if (filtro?.fecha) {
    query = query.eq('fecha', filtro.fecha)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error al listar tickets: ${error.message}`)

  return data as Ticket[]
}

/**
 * Check-in: marca un ticket como usado.
 *
 * Doble señal para el reintento: el UPDATE solo aplica si estado='emitido';
 * si la fila ya está 'usado' devuelve un aviso explícito (la UI además
 * deshabilita el botón y muestra el badge "Usado").
 */
export async function checkInTicket(
  input: unknown,
): Promise<
  { success: true } | { success: false; error: string }
> {
  const parsed = checkInTicketSchema.parse(input)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .update({ estado: 'usado' })
    .eq('id', parsed.ticket_id)
    .eq('estado', 'emitido')
    .select('id')

  if (error) throw new Error(`Error al hacer check-in: ${error.message}`)

  if (!data || data.length === 0) {
    // No aplicó: averiguar por qué para avisar con precisión
    const { data: ticket } = await supabase
      .from('tickets')
      .select('estado')
      .eq('id', parsed.ticket_id)
      .single()

    if (ticket?.estado === 'usado') {
      return { success: false, error: 'Este ticket ya fue usado' }
    }
    if (ticket?.estado === 'cancelado') {
      return { success: false, error: 'Este ticket está cancelado' }
    }
    return { success: false, error: 'No se encontró el ticket' }
  }

  revalidatePath('/admin/pasadias')

  return { success: true }
}

// ============================================================================
// Cupos por fecha
// ============================================================================

/** Merge de overrides de pass_capacity + agregado real de tickets por fecha. */
export async function listCapacity(): Promise<CapacityRow[]> {
  const supabase = await createClient()

  const [{ data: overrides, error: capError }, { data: tickets, error: ticketError }] =
    await Promise.all([
      supabase.from('pass_capacity').select('*').order('fecha', { ascending: false }),
      supabase
        .from('tickets')
        .select('fecha, personas, estado')
        .order('fecha', { ascending: false })
        .limit(2000),
    ])

  if (capError) throw new Error(`Error al listar cupos: ${capError.message}`)
  if (ticketError) throw new Error(`Error al calcular ocupación: ${ticketError.message}`)

  const capOverrides = new Map<string, number>()
  for (const row of (overrides ?? []) as PassCapacity[]) {
    capOverrides.set(row.fecha, row.cupo_maximo)
  }

  const usadoPorFecha = new Map<string, number>()
  for (const t of tickets ?? []) {
    if (t.estado === 'cancelado') continue
    usadoPorFecha.set(t.fecha, (usadoPorFecha.get(t.fecha) ?? 0) + t.personas)
  }

  const fechas = new Set<string>([...capOverrides.keys(), ...usadoPorFecha.keys()])
  const rows: CapacityRow[] = [...fechas].map((fecha) => {
    const override = capOverrides.get(fecha)
    const cupo = override ?? CAPACIDAD_DEFAULT_PASADIA
    const usado = usadoPorFecha.get(fecha) ?? 0
    return { fecha, cupo, esDefault: override === undefined, usado, disponible: cupo - usado }
  })

  return rows.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
}

/** Crea o actualiza el cupo de una fecha (upsert sobre unique(fecha)). */
export async function setPassCapacity(input: unknown): Promise<{ success: boolean; error?: string }> {
  const parsed = setCapacitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('pass_capacity')
    .upsert({ fecha: parsed.data.fecha, cupo_maximo: parsed.data.cupo_maximo }, { onConflict: 'fecha' })

  if (error) throw new Error(`Error al guardar el cupo: ${error.message}`)

  revalidatePath('/admin/pasadias')
  revalidatePath('/pasadias')

  return { success: true }
}
