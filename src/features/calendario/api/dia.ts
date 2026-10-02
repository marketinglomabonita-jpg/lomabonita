import { createClient } from '@/core/adapters/supabase/server'
import { CUPO_DEFAULT_PASADIA } from './queries'

/**
 * Detalle de un día del calendario (R3): estado de las 10 habitaciones,
 * pasadías del día y cupo restante. Los no-cruce y el cupo los garantiza la
 * BD (restricción de exclusión + trigger); aquí solo se leen y se muestran.
 */

/** Habitación con su estado de ocupación en un día concreto. */
export type HabitacionDelDia = {
  id: string
  numero: number
  nombre: string
  capacidad: number | null
  /** Nombre del huésped de la reserva activa que cubre el día, si la hay. */
  ocupadaPor: string | null
}

/** Habitación candidata para un rango: activa y sin reserva ni bloqueo que solape. */
export type HabitacionLibre = {
  id: string
  numero: number
  nombre: string
  capacidad: number | null
}

/** Plan de pasadía elegible, con precio por persona. */
export type PlanPasadia = {
  slug: string
  nombre: string
  precio: number
}

/** Pasadía (ticket) ya emitida para el día. */
export type PasadiaDelDia = {
  id: string
  codigo: string
  nombre: string
  personas: number
  total: number
}

export type DetalleDia = {
  fecha: string
  habitaciones: HabitacionDelDia[]
  pasadias: PasadiaDelDia[]
  /** Personas de pasadía ya registradas ese día (tickets no cancelados). */
  pasadiaPersonas: number
  /** Cupo disponible según la RPC pública (cupo del día − personas ya usadas). */
  cupoRestante: number
}

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const DIAS_SEMANA_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** ¿YYYY-MM-DD con partes reales? (rechaza 2026-02-31). Comparación UTC pura. */
export function esFechaISOValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDate() === dia
}

/** YYYY-MM-DD del día siguiente, por partes UTC (sin desfase de zona). */
export function diaSiguiente(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const siguiente = new Date(Date.UTC(anio, mes - 1, dia + 1))
  return siguiente.toISOString().slice(0, 10)
}

/** Fecha legible en español: "jueves 1 de octubre de 2026". */
export function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return `${DIAS_SEMANA_ES[diaSemana]} ${dia} de ${MESES_ES[mes - 1]} de ${anio}`
}

/**
 * Las habitaciones LIBRES para el rango [checkIn, checkOut): activas, sin
 * reserva `solicitada`/`confirmada` que solape y sin room_block que solape.
 * La verdad final la sigue teniendo la restricción de exclusión de la BD: esto
 * solo filtra la UI para ofrecer opciones sensatas.
 */
export async function habitacionesLibres(
  checkIn: string,
  checkOut: string,
): Promise<HabitacionLibre[]> {
  const supabase = await createClient()

  const [rooms, reservas, bloques] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, numero, nombre, capacidad')
      .eq('activa', true)
      .order('numero'),
    supabase
      .from('reservations')
      .select('room_id')
      .in('estado', ['solicitada', 'confirmada'])
      .overlaps('during', `[${checkIn},${checkOut})`),
    supabase.from('room_blocks').select('room_id').overlaps('during', `[${checkIn},${checkOut})`),
  ])

  if (rooms.error) throw new Error(`Error al listar habitaciones: ${rooms.error.message}`)
  if (reservas.error) throw new Error(`Error al buscar reservas: ${reservas.error.message}`)
  if (bloques.error) throw new Error(`Error al buscar bloqueos: ${bloques.error.message}`)

  const ocupadas = new Set<string>()
  for (const r of (reservas.data ?? []) as { room_id: string | null }[]) {
    if (r.room_id) ocupadas.add(r.room_id)
  }
  for (const b of (bloques.data ?? []) as { room_id: string }[]) {
    ocupadas.add(b.room_id)
  }

  return ((rooms.data ?? []) as HabitacionLibre[]).filter((h) => !ocupadas.has(h.id))
}

/** Planes reales de pasadía (is_sample = false) para el selector del formulario. */
export async function getPlanesPasadia(): Promise<PlanPasadia[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pass_products')
    .select('slug, nombre, precio_persona_muestra')
    .eq('is_sample', false)
    .order('nombre')

  if (error) throw new Error(`Error al listar planes de pasadía: ${error.message}`)

  return ((data ?? []) as Array<{
    slug: string
    nombre: string
    precio_persona_muestra: number | null
  }>).map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    precio: Number(p.precio_persona_muestra ?? 0),
  }))
}

/**
 * Estado completo de un día: las 10 habitaciones con quién las ocupa,
 * las pasadías emitidas y el cupo restante (RPC pública de la BD).
 * Lee con el cliente RLS del staff (createClient), nunca service-role.
 */
export async function getDetalleDia(fecha: string): Promise<DetalleDia> {
  const supabase = await createClient()

  // Un día ocupa [fecha, diaSiguiente): solapar con ese rango de 1 día es
  // exactamente "el during contiene el día" (la salida es exclusiva).
  const [rooms, reservas, tickets, cupo] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, numero, nombre, capacidad')
      .eq('activa', true)
      .order('numero'),
    supabase
      .from('reservations')
      .select('room_id, nombre')
      .in('estado', ['solicitada', 'confirmada'])
      .overlaps('during', `[${fecha},${diaSiguiente(fecha)})`),
    supabase
      .from('tickets')
      .select('id, codigo, nombre, personas, total_muestra')
      .eq('fecha', fecha)
      .neq('estado', 'cancelado')
      .order('created_at'),
    supabase.rpc('ticket_cupo_disponible', { p_fecha: fecha }),
  ])

  if (rooms.error) throw new Error(`Error al listar habitaciones: ${rooms.error.message}`)
  if (reservas.error) throw new Error(`Error al listar reservas: ${reservas.error.message}`)
  if (tickets.error) throw new Error(`Error al listar tickets: ${tickets.error.message}`)
  if (cupo.error) throw new Error(`Error al consultar el cupo: ${cupo.error.message}`)

  // room_id → nombre(s) de quien(es) ocupan ese día.
  const ocupadaPor = new Map<string, string[]>()
  for (const r of (reservas.data ?? []) as { room_id: string | null; nombre: string }[]) {
    if (!r.room_id) continue
    ocupadaPor.set(r.room_id, [...(ocupadaPor.get(r.room_id) ?? []), r.nombre])
  }

  const pasadias = ((tickets.data ?? []) as Array<{
    id: string
    codigo: string
    nombre: string
    personas: number
    total_muestra: number | null
  }>).map((t) => ({
    id: t.id,
    codigo: t.codigo,
    nombre: t.nombre,
    personas: t.personas,
    total: Number(t.total_muestra ?? 0),
  }))

  return {
    fecha,
    habitaciones: ((rooms.data ?? []) as Array<{
      id: string
      numero: number
      nombre: string
      capacidad: number | null
    }>).map((h) => ({
      id: h.id,
      numero: h.numero,
      nombre: h.nombre,
      capacidad: h.capacidad,
      ocupadaPor: ocupadaPor.get(h.id)?.[0] ?? null,
    })),
    pasadias,
    pasadiaPersonas: pasadias.reduce((suma, t) => suma + t.personas, 0),
    // Fallback defensivo al default documentado si la RPC no devolviera número.
    cupoRestante: Number.isFinite(Number(cupo.data)) ? Number(cupo.data) : CUPO_DEFAULT_PASADIA,
  }
}
