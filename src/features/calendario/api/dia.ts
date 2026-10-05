import { createClient } from '@/core/adapters/supabase/server'
import { CUPO_DEFAULT_PASADIA } from './queries'

/**
 * Detalle de un día del calendario (R3): estado de las 10 habitaciones,
 * pasadías del día y cupo restante. Los no-cruce y el cupo los garantiza la
 * BD (restricción de exclusión + trigger); aquí solo se leen y se muestran.
 * Desde la gestión de reservas (R5) cada reserva/pasadía viaja completa:
 * contacto, fechas, valor, abonado, saldo y comprobantes, para que la UI
 * de gestión (editar/cancelar/abonar) no tenga que volver a consultar.
 */

/**
 * Reserva activa (solicitada/confirmada) que cubre el día consultado, con
 * todo lo que su gestión necesita: contacto, rango, dinero y comprobantes.
 */
export type ReservaDelDia = {
  id: string
  codigo: string | null
  nombre: string
  telefono: string | null
  email: string | null
  estado: 'solicitada' | 'confirmada'
  /** Habitación reservada; null si la habitación fue eliminada de la BD. */
  room_id: string | null
  /** Llegada y salida en YYYY-MM-DD, partidas del daterange [llegada, salida). */
  llegada: string | null
  salida: string | null
  /** Valor acordado; null mientras siga "por definir". */
  valor_total: number | null
  /** Σ payments.monto de la reserva (0 si no tiene abonos). */
  abonado: number
  /** valor_total − abonado; null mientras el valor siga "por definir". */
  saldo: number | null
  /** Momento del check-in (llegada real) en ISO; null si aún no ha llegado. */
  checkinAt: string | null
  /** Rutas de comprobantes subidos (la URL firmada la pide urlComprobante). */
  comprobantes: string[]
  /** Grupo al que pertenece la fila (casa llena / grupal); null = individual. */
  grupoId: string | null
  grupoTipo: 'casa_llena' | 'grupal' | null
  /**
   * Nº total de personas del grupo; SOLO lo trae la fila representante de una
   * reserva grupal (las demás filas, y las de casa llena, van con null).
   */
  participantes: number | null
}

/** Habitación con su estado de ocupación en un día concreto. */
export type HabitacionDelDia = {
  id: string
  numero: number
  nombre: string
  capacidad: number | null
  /** Nombre del huésped de la reserva activa que cubre el día, si la hay. */
  ocupadaPor: string | null
  /**
   * La reserva activa que ocupa la habitación ese día (gestión R5): la
   * restricción de exclusión garantiza que sea a lo sumo UNA por habitación y
   * rango; null si está libre. `ocupadaPor` es `reserva?.nombre` y se mantiene
   * por compatibilidad con quienes ya lo leían.
   */
  reserva: ReservaDelDia | null
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

/**
 * Una línea del desglose de un grupo combinado (R4): un plan, cuántas personas
 * van en él y su cuenta. Espejo del jsonb tickets.lineas que escribe
 * crearPasadia; el precio y el subtotal los calculó el servidor.
 */
export type LineaPasadia = {
  plan: string
  nombre: string
  personas: number
  precio_persona: number
  subtotal: number
}

/** Pasadía (ticket) ya emitida para el día. */
export type PasadiaDelDia = {
  id: string
  codigo: string
  nombre: string
  /** Personas TOTALES del grupo (suma de líneas): la base del cupo. */
  personas: number
  total: number
  /** Desglose por plan cuando el grupo combinó planes ([] en tickets viejos). */
  lineas: LineaPasadia[]
  telefono: string | null
  email: string | null
  /** 'emitido' o 'usado': los cancelados no llegan aquí (el filtro los excluye). */
  estado: 'emitido' | 'usado'
  /** Σ payments.monto del ticket (0 si no tiene abonos). */
  abonado: number
  /** total − abonado; null si el ticket no tiene total definido. */
  saldo: number | null
  /** Momento del check-in (llegada real) en ISO; null si aún no ha llegado. */
  checkinAt: string | null
  /** Rutas de comprobantes subidos (la URL firmada la pide urlComprobante). */
  comprobantes: string[]
}

export type DetalleDia = {
  fecha: string
  habitaciones: HabitacionDelDia[]
  /**
   * Reservas activas del día que NO cuelgan de ninguna habitación listada
   * (habitación eliminada o desactivada con la reserva viva): no aparecen en
   * `habitaciones`, pero siguen existiendo y se deben poder gestionar.
   */
  reservasSinHabitacion: ReservaDelDia[]
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

/** Redondea a 2 decimales: los numeric llegan como texto y suman ruido de FP. */
function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100
}

/**
 * Parte el texto de un daterange "[llegada,salida)" en sus dos fechas. Si el
 * texto no tuviera el formato acotado que escriben todas las vías de creación,
 * devuelve nulls en vez de adivinar (la UI decide cómo mostrarlo).
 */
function partirDuring(during: string): { llegada: string | null; salida: string | null } {
  const partes = /^\[(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})\)$/.exec(during)
  return partes ? { llegada: partes[1], salida: partes[2] } : { llegada: null, salida: null }
}

/** Abonos y comprobantes agregados por destino (una sola consulta a payments). */
async function abonosPorDestino(
  supabase: Awaited<ReturnType<typeof createClient>>,
  columna: 'reservation_id' | 'ticket_id',
  ids: string[],
): Promise<Map<string, { abonado: number; comprobantes: string[] }>> {
  if (ids.length === 0) return new Map()

  const { data, error } = await supabase
    .from('payments')
    .select(`${columna}, monto, comprobante_path`)
    .in(columna, ids)

  if (error) throw new Error(`Error al leer los abonos: ${error.message}`)

  const porDestino = new Map<string, { abonado: number; comprobantes: string[] }>()
  for (const pago of (data ?? []) as Array<Record<string, unknown>>) {
    const destino = pago[columna]
    if (typeof destino !== 'string') continue
    const actual = porDestino.get(destino) ?? { abonado: 0, comprobantes: [] }
    actual.abonado = redondear2(actual.abonado + Number(pago.monto ?? 0))
    if (typeof pago.comprobante_path === 'string' && pago.comprobante_path !== '') {
      actual.comprobantes.push(pago.comprobante_path)
    }
    porDestino.set(destino, actual)
  }
  return porDestino
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
 * Estado completo de un día: las 10 habitaciones con quién las ocupa (y la
 * reserva completa, para gestionarla), las pasadías emitidas con su saldo y
 * el cupo restante (RPC pública de la BD). Lee con el cliente RLS del staff
 * (createClient), nunca service-role.
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
      .select(
        'id, codigo, room_id, nombre, telefono, email, estado, during, valor_total, checkin_at, grupo_id, grupo_tipo, participantes',
      )
      .in('estado', ['solicitada', 'confirmada'])
      .overlaps('during', `[${fecha},${diaSiguiente(fecha)})`),
    supabase
      .from('tickets')
      .select('id, codigo, nombre, telefono, email, estado, personas, total_muestra, lineas, checkin_at')
      .eq('fecha', fecha)
      .neq('estado', 'cancelado')
      .order('created_at'),
    supabase.rpc('ticket_cupo_disponible', { p_fecha: fecha }),
  ])

  if (rooms.error) throw new Error(`Error al listar habitaciones: ${rooms.error.message}`)
  if (reservas.error) throw new Error(`Error al buscar reservas: ${reservas.error.message}`)
  if (tickets.error) throw new Error(`Error al leer las pasadías: ${tickets.error.message}`)
  if (cupo.error) throw new Error(`Error al consultar el cupo: ${cupo.error.message}`)

  const crudasReservas = (reservas.data ?? []) as Array<{
    id: string
    codigo: string | null
    room_id: string | null
    nombre: string
    telefono: string | null
    email: string | null
    estado: string
    during: string
    valor_total: number | string | null
    checkin_at: string | null
    grupo_id: string | null
    grupo_tipo: string | null
    participantes: number | null
  }>
  const crudasTickets = (tickets.data ?? []) as Array<{
    id: string
    codigo: string
    nombre: string
    telefono: string | null
    email: string | null
    estado: string
    personas: number
    total_muestra: number | string | null
    lineas: unknown
    checkin_at: string | null
  }>

  // Abonos y comprobantes de todos los destinos del día, agrupados por id.
  const [abonosReservas, abonosTickets] = await Promise.all([
    abonosPorDestino(supabase, 'reservation_id', crudasReservas.map((r) => r.id)),
    abonosPorDestino(supabase, 'ticket_id', crudasTickets.map((t) => t.id)),
  ])

  const aReservaDelDia = (r: (typeof crudasReservas)[number]): ReservaDelDia => {
    const { llegada, salida } = partirDuring(r.during)
    const valorTotal = r.valor_total === null ? null : redondear2(Number(r.valor_total))
    const abonos = abonosReservas.get(r.id) ?? { abonado: 0, comprobantes: [] }
    return {
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      telefono: r.telefono,
      email: r.email,
      // El filtro de la consulta solo deja pasar estos dos estados.
      estado: r.estado === 'solicitada' ? 'solicitada' : 'confirmada',
      room_id: r.room_id,
      llegada,
      salida,
      valor_total: valorTotal,
      abonado: abonos.abonado,
      saldo: valorTotal === null ? null : redondear2(valorTotal - abonos.abonado),
      checkinAt: r.checkin_at ?? null,
      comprobantes: abonos.comprobantes,
      // Grupo (0026): null en reservas individuales; el tipo solo puede ser
      // uno de los dos valores del check de la BD, cualquier otra cosa → null.
      grupoId: r.grupo_id ?? null,
      grupoTipo: r.grupo_tipo === 'casa_llena' || r.grupo_tipo === 'grupal' ? r.grupo_tipo : null,
      participantes: r.participantes ?? null,
    }
  }

  const reservasDelDia = crudasReservas.map(aReservaDelDia)

  // room_id → reserva activa: la exclusión garantiza una sola por habitación.
  const reservaPorRoom = new Map<string, ReservaDelDia>()
  for (const r of reservasDelDia) {
    if (r.room_id) reservaPorRoom.set(r.room_id, r)
  }

  const pasadias = crudasTickets.map((t) => {
    const abonos = abonosTickets.get(t.id) ?? { abonado: 0, comprobantes: [] }
    return {
      id: t.id,
      codigo: t.codigo,
      nombre: t.nombre,
      telefono: t.telefono,
      email: t.email,
      // El filtro de la consulta ya excluyó 'cancelado'.
      estado: t.estado === 'usado' ? ('usado' as const) : ('emitido' as const),
      personas: t.personas,
      total: Number(t.total_muestra ?? 0),
      // lineas llega como jsonb (unknown): se normaliza campo por campo para no
      // propagar un shape inesperado a la UI (los tickets viejos traen []).
      lineas: (Array.isArray(t.lineas) ? (t.lineas as unknown[]) : []).map((cruda) => {
        const l = (cruda ?? {}) as Partial<LineaPasadia>
        return {
          plan: String(l.plan ?? ''),
          nombre: String(l.nombre ?? ''),
          personas: Number(l.personas ?? 0),
          precio_persona: Number(l.precio_persona ?? 0),
          subtotal: Number(l.subtotal ?? 0),
        }
      }),
      abonado: abonos.abonado,
      saldo:
        t.total_muestra === null
          ? null
          : redondear2(Number(t.total_muestra) - abonos.abonado),
      checkinAt: t.checkin_at ?? null,
      comprobantes: abonos.comprobantes,
    }
  })

  const idsRoomsActivas = new Set(((rooms.data ?? []) as Array<{ id: string }>).map((h) => h.id))

  return {
    fecha,
    habitaciones: ((rooms.data ?? []) as Array<{
      id: string
      numero: number
      nombre: string
      capacidad: number | null
    }>).map((h) => {
      const reserva = reservaPorRoom.get(h.id) ?? null
      return {
        id: h.id,
        numero: h.numero,
        nombre: h.nombre,
        capacidad: h.capacidad,
        ocupadaPor: reserva?.nombre ?? null,
        reserva,
      }
    }),
    reservasSinHabitacion: reservasDelDia.filter(
      (r) => !r.room_id || !idsRoomsActivas.has(r.room_id),
    ),
    pasadias,
    pasadiaPersonas: pasadias.reduce((suma, t) => suma + t.personas, 0),
    // Fallback defensivo al default documentado si la RPC no devolviera número.
    cupoRestante: Number.isFinite(Number(cupo.data)) ? Number(cupo.data) : CUPO_DEFAULT_PASADIA,
  }
}
