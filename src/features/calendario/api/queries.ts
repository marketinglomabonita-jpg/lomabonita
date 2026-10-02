import { createClient } from '@/core/adapters/supabase/server'

/**
 * Cupo por defecto de pasadías cuando una fecha no tiene fila en
 * pass_capacity. Desde la migración 0020_panel_datos_reales.sql el default
 * documentado es 100 (antes era 60 en la migración 0009).
 */
export const CUPO_DEFAULT_PASADIA = 100

/** Panorama de ocupación de un día del mes, para la vista Mes del calendario. */
export type DiaOcupacion = {
  /** Fecha en texto YYYY-MM-DD (nunca un Date con zona horaria). */
  fecha: string
  /** Habitaciones con reserva activa ese día. */
  roomsOcupadas: number
  /** Habitaciones activas de la finca (10). */
  totalRooms: number
  /** Personas de pasadía ese día (tickets no cancelados). */
  pasadiaPersonas: number
  /** Cupo de pasadía del día (override o default). */
  cupo: number
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Fecha ISO YYYY-MM-DD armada por partes, sin pasar por Date local. */
function iso(anio: number, mes: number, dia: number): string {
  return `${anio}-${pad2(mes)}-${pad2(dia)}`
}

/** Cantidad de días de un mes (mes 1-12). Aritmética Date.UTC consistente. */
function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate()
}

/** YYYY-MM del mes siguiente (maneja el relevo de año). */
function mesSiguiente(mes: string): string {
  const [anio, m] = mes.split('-').map(Number)
  return m === 12 ? `${anio + 1}-01` : `${anio}-${pad2(m + 1)}`
}

/**
 * Fecha de hoy en Colombia (UTC-5 fijo, sin DST) como YYYY-MM-DD.
 * Se lee la parte de fecha de un instante UTC desplazado -5h: `toISOString()`
 * es siempre UTC, así que el resultado no depende de la zona del servidor.
 * Nunca `new Date('YYYY-MM-DD')`, que en UTC-5 retrocede un día.
 */
export function hoyColombia(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** Límites [inicio, fin) de un daterange serializado "[2026-10-01,2026-10-05)". */
function limitesDeRango(during: string): { inicio: string; fin: string } | null {
  const cuerpo = during.replace(/[[\]()"]/g, '')
  const [inicio, fin] = cuerpo.split(',')
  if (!inicio || !fin) return null
  return { inicio, fin }
}

/**
 * ¿El día (YYYY-MM-DD) cae dentro de [inicio, fin)?
 * Comparación lexicográfica de texto = comparación cronológica en ISO.
 * La salida es EXCLUSIVA: la noche de checkout no cuenta como ocupada.
 */
function rangoOcupaDia(during: string, dia: string): boolean {
  const limites = limitesDeRango(during)
  if (!limites) return false
  return limites.inicio <= dia && dia < limites.fin
}

/** Habitaciones ocupadas por día (Set de room_id). Solo estados activos. */
function habitacionesPorDia(
  anio: number,
  mes: number,
  reservas: { room_id: string | null; during: string }[],
): Map<string, Set<string>> {
  const ocupadas = new Map<string, Set<string>>()
  const nDias = diasDelMes(anio, mes)

  for (const r of reservas) {
    if (!r.room_id) continue
    for (let d = 1; d <= nDias; d++) {
      const dia = iso(anio, mes, d)
      if (!rangoOcupaDia(r.during, dia)) continue
      const set = ocupadas.get(dia) ?? new Set<string>()
      set.add(r.room_id)
      ocupadas.set(dia, set)
    }
  }

  return ocupadas
}

/** Personas de pasadía por día (los cancelados ya quedaron fuera del query). */
function personasPorDia(tickets: { fecha: string; personas: number }[]): Map<string, number> {
  const porDia = new Map<string, number>()
  for (const t of tickets) {
    porDia.set(t.fecha, (porDia.get(t.fecha) ?? 0) + t.personas)
  }
  return porDia
}

/**
 * Ocupación día a día de un mes, para la vista Mes del calendario del panel.
 *
 * - roomsOcupadas: habitaciones con reserva `solicitada`/`confirmada` cuyo
 *   `during` contiene el día. Una reserva ocupa [llegada, salida): la noche
 *   de salida queda libre. Canceladas y rechazadas no cuentan.
 * - pasadiaPersonas: suma de tickets.personas con estado <> 'cancelado'.
 * - cupo: override de pass_capacity para el día, o 100 por defecto.
 *
 * Lee con el cliente RLS del staff (createClient), nunca service-role.
 */
export async function getOcupacionMes(anio: number, mes: number): Promise<DiaOcupacion[]> {
  const mesISO = `${anio}-${pad2(mes)}`
  const inicio = `${mesISO}-01`
  const finExclusivo = `${mesSiguiente(mesISO)}-01`

  const supabase = await createClient()

  const [rooms, reservas, tickets, cupos] = await Promise.all([
    supabase.from('rooms').select('id').eq('activa', true),
    supabase
      .from('reservations')
      .select('room_id, during')
      .in('estado', ['solicitada', 'confirmada'])
      // Reservas que tocan el mes: su during solapa [inicio, finExclusivo)
      .overlaps('during', `[${inicio},${finExclusivo})`),
    supabase
      .from('tickets')
      .select('fecha, personas')
      .neq('estado', 'cancelado')
      .gte('fecha', inicio)
      .lt('fecha', finExclusivo),
    supabase
      .from('pass_capacity')
      .select('fecha, cupo_maximo')
      .gte('fecha', inicio)
      .lt('fecha', finExclusivo),
  ])

  if (rooms.error) throw new Error(`Error al listar habitaciones: ${rooms.error.message}`)
  if (reservas.error) throw new Error(`Error al listar reservas: ${reservas.error.message}`)
  if (tickets.error) throw new Error(`Error al listar tickets: ${tickets.error.message}`)
  if (cupos.error) throw new Error(`Error al listar cupos: ${cupos.error.message}`)

  const totalRooms = (rooms.data ?? []).length
  const ocupadas = habitacionesPorDia(
    anio,
    mes,
    (reservas.data ?? []) as { room_id: string | null; during: string }[],
  )
  const personas = personasPorDia((tickets.data ?? []) as { fecha: string; personas: number }[])
  const cupoPorDia = new Map(
    ((cupos.data ?? []) as { fecha: string; cupo_maximo: number }[]).map((c) => [
      c.fecha,
      c.cupo_maximo,
    ]),
  )

  const filas: DiaOcupacion[] = []
  for (let d = 1; d <= diasDelMes(anio, mes); d++) {
    const fecha = iso(anio, mes, d)
    filas.push({
      fecha,
      roomsOcupadas: ocupadas.get(fecha)?.size ?? 0,
      totalRooms,
      pasadiaPersonas: personas.get(fecha) ?? 0,
      cupo: cupoPorDia.get(fecha) ?? CUPO_DEFAULT_PASADIA,
    })
  }

  return filas
}
