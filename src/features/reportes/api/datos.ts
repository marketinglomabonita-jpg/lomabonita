import { createClient } from '@/core/adapters/supabase/server'

/**
 * Datos del reporte descargable (lectura ONLY): arma el contenido de las 4
 * hojas del Excel para un rango día/semana/mes. Todo el dinero se calcula aquí,
 * en el servidor, desde la BD; el Excel solo formatea.
 *
 * Criterios del rango (zona Colombia, fechas SIEMPRE en texto YYYY-MM-DD):
 * - Día = ese día; Semana = lunes→domingo que contiene la fecha; Mes = mes completo.
 * - Reservas: entra la reserva cuya LLEGADA (lower del daterange `during`) cae
 *   dentro del rango, en cualquier estado (canceladas/rechazadas se listan
 *   marcadas pero no suman a ingresos). Las que llegaron antes y siguen dentro
 *   del rango NO entran (su ingreso quedó contado en el período de su llegada).
 * - Pasadías: tickets con `fecha` dentro del rango, en cualquier estado.
 * - Pagos: payments con `created_at` dentro del rango (UTC-5 fijo, sin DST).
 *
 * Los helpers de fecha están copiados a propósito (queries.ts/resumen.ts del
 * calendario los tienen, pero viven pegados a ese feature y ese archivo está
 * en obra por otro frente): son funciones puras de texto, sin dependencias.
 */

export type Periodo = 'dia' | 'semana' | 'mes'

/** Rango inclusivo [inicio, fin] en YYYY-MM-DD. */
export type RangoReporte = { periodo: Periodo; inicio: string; fin: string }

export type FilaReserva = {
  codigo: string
  nombre: string
  contacto: string
  habitacion: string
  llegada: string
  salida: string
  estado: string
  /** null = valor "por definir". */
  valorTotal: number | null
  abonado: number
  saldo: number | null
}

export type FilaPasadia = {
  codigo: string
  nombre: string
  contacto: string
  fecha: string
  personas: number
  estado: string
  total: number | null
  abonado: number
  saldo: number | null
  /** Desglose legible de `lineas` (jsonb): "3 × Loma Relax ($135.000)". */
  planes: string
}

export type FilaPago = {
  fecha: string
  monto: number
  medio: string
  /** 'Reserva' | 'Pasadía' | '—'. */
  destino: string
  codigo: string
}

export type ResumenReporte = {
  /** Todas las reservas con llegada en el rango (la hoja las detalla). */
  reservas: number
  pasadias: number
  /** Σ personas de tickets no cancelados del rango. */
  personasPasadia: number
  /** Σ valor_total de reservas activas + Σ total de pasadías no canceladas. */
  ingresosEsperados: number
  /** Σ payments.monto registrados dentro del rango. */
  abonadoEnRango: number
  /** ingresosEsperados − abonadoEnRango. */
  saldoPendiente: number
  /** Σ saldos de las reservas y pasadías ACTIVAS del rango (deuda del período). */
  saldoPorCobrarRango: number
}

export type DatosReporte = {
  rango: RangoReporte
  resumen: ResumenReporte
  reservas: FilaReserva[]
  pasadias: FilaPasadia[]
  pagos: FilaPago[]
}

const ESTADOS_ACTIVOS_RESERVA = ['solicitada', 'confirmada']

// ---------------------------------------------------------------------------
// Helpers de fecha: texto YYYY-MM-DD y aritmética Date.UTC pura (nunca
// `new Date('YYYY-MM-DD')`, que en UTC-5 retrocede un día).
// ---------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Hoy en Colombia (UTC-5 fijo, sin DST) como YYYY-MM-DD. */
export function hoyColombia(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** ¿YYYY-MM-DD con partes reales? (rechaza 2026-02-31). Comparación UTC pura. */
export function esFechaISOValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDate() === dia
}

/** YYYY-MM-DD desplazado ±n días, por partes UTC (sin desfase de zona). */
function desplazarDias(fecha: string, delta: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + delta)).toISOString().slice(0, 10)
}

/** Lunes (YYYY-MM-DD) de la semana que contiene `fecha`. Date.UTC puro. */
function lunesDe(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay() // 0 = domingo
  return desplazarDias(fecha, -((diaSemana + 6) % 7))
}

/**
 * Rango inclusivo del período que contiene `fechaRef`:
 * Día = [f, f]; Semana = [lunes, domingo]; Mes = [día 1, último día].
 */
export function rangoDe(periodo: Periodo, fechaRef: string): RangoReporte {
  if (periodo === 'semana') {
    const lunes = lunesDe(fechaRef)
    return { periodo, inicio: lunes, fin: desplazarDias(lunes, 6) }
  }
  if (periodo === 'mes') {
    const [anio, mes] = fechaRef.split('-').map(Number)
    const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
    return { periodo, inicio: `${anio}-${pad2(mes)}-01`, fin: `${anio}-${pad2(mes)}-${pad2(ultimoDia)}` }
  }
  return { periodo, inicio: fechaRef, fin: fechaRef }
}

/** Redondea a 2 decimales: los numeric llegan como texto y suman ruido de FP. */
function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100
}

/** Parte un daterange "[llegada,salida)" en sus dos fechas; nulls si no calza. */
function partirDuring(during: string): { llegada: string | null; salida: string | null } {
  const partes = /^\[(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})\)$/.exec(during)
  return partes ? { llegada: partes[1], salida: partes[2] } : { llegada: null, salida: null }
}

/** Fecha (YYYY-MM-DD) Colombia de un timestamptz UTC-5 fijo. */
function fechaColombia(iso: string): string {
  const instante = Date.parse(iso)
  return Number.isFinite(instante)
    ? new Date(instante - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : iso.slice(0, 10)
}

/** "3105551234 · ana@correo.com" desde tel/email sueltos. */
function contactoDe(telefono: string | null, email: string | null): string {
  return [telefono, email].filter((v) => typeof v === 'string' && v !== '').join(' · ')
}

type LineaPasadiaCruda = Partial<{
  plan: string
  nombre: string
  personas: number
  precio_persona: number
  subtotal: number
}>

/** "3 × Loma Relax ($135.000); 2 × Loma Racing ($100.000)" desde tickets.lineas. */
function describirLineas(lineas: unknown): string {
  if (!Array.isArray(lineas) || lineas.length === 0) return ''
  const partes = lineas.map((cruda) => {
    const l = (cruda ?? {}) as LineaPasadiaCruda
    if (typeof l.personas !== 'number' || !l.nombre) return ''
    const subtotal = typeof l.subtotal === 'number' ? ` ($${l.subtotal.toLocaleString('es-CO')})` : ''
    return `${l.personas} × ${l.nombre}${subtotal}`
  })
  return partes.filter(Boolean).join('; ')
}

/** Σ monto de payments por destino (todos los pagos del destino, sin filtro de fecha). */
async function abonosPorDestino(
  supabase: Awaited<ReturnType<typeof createClient>>,
  columna: 'reservation_id' | 'ticket_id',
  ids: string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase
    .from('payments')
    .select(`${columna}, monto`)
    .in(columna, ids)
  if (error) throw new Error(`Error al leer los abonos: ${error.message}`)

  const porDestino = new Map<string, number>()
  for (const pago of (data ?? []) as Array<Record<string, unknown>>) {
    const destino = pago[columna]
    if (typeof destino !== 'string') continue
    porDestino.set(destino, redondear2((porDestino.get(destino) ?? 0) + Number(pago.monto ?? 0)))
  }
  return porDestino
}

type ReservaCruda = {
  id: string
  codigo: string | null
  room_id: string | null
  nombre: string
  telefono: string | null
  email: string | null
  estado: string
  during: string
  valor_total: number | string | null
}

type TicketCrudo = {
  id: string
  codigo: string
  nombre: string
  telefono: string | null
  email: string | null
  estado: string
  fecha: string
  personas: number
  total_muestra: number | string | null
  lineas: unknown
}

type PagoCrudo = {
  reservation_id: string | null
  ticket_id: string | null
  monto: number | string
  medio: string | null
  created_at: string
}

/** Códigos de reservas/tickets que los pagos del rango referencian y no están cargados. */
async function codigosFaltantes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tabla: 'reservations' | 'tickets',
  ids: string[],
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>()
  if (ids.length === 0) return mapa
  const { data, error } = await supabase.from(tabla).select('id, codigo').in('id', ids)
  if (error) throw new Error(`Error al leer los códigos de ${tabla}: ${error.message}`)
  for (const fila of (data ?? []) as Array<{ id: string; codigo: string | null }>) {
    mapa.set(fila.id, fila.codigo ?? fila.id)
  }
  return mapa
}

/**
 * Todo el contenido del reporte del rango. Lee con el cliente RLS de la
 * sesión (createClient): las policies de staff permiten leer; nunca service-role.
 */
export async function getDatosReporte(periodo: Periodo, fechaRef: string): Promise<DatosReporte> {
  const rango = rangoDe(periodo, fechaRef)
  const finExclusivo = desplazarDias(rango.fin, 1)
  const supabase = await createClient()

  const [rooms, reservasTodas, tickets] = await Promise.all([
    supabase.from('rooms').select('id, numero, nombre'),
    // Cualquier estado; el filtro fino por llegada se hace sobre el texto del during.
    supabase
      .from('reservations')
      .select('id, codigo, room_id, nombre, telefono, email, estado, during, valor_total')
      .overlaps('during', `[${rango.inicio},${finExclusivo})`)
      .order('during'),
    supabase
      .from('tickets')
      .select('id, codigo, nombre, telefono, email, estado, fecha, personas, total_muestra, lineas')
      .gte('fecha', rango.inicio)
      .lte('fecha', rango.fin)
      .order('fecha')
      .order('created_at'),
  ])

  if (rooms.error) throw new Error(`Error al listar habitaciones: ${rooms.error.message}`)
  if (reservasTodas.error) throw new Error(`Error al buscar reservas: ${reservasTodas.error.message}`)
  if (tickets.error) throw new Error(`Error al leer las pasadías: ${tickets.error.message}`)

  const nombreHabitacion = new Map(
    ((rooms.data ?? []) as Array<{ id: string; numero: number; nombre: string }>).map((h) => [
      h.id,
      `${h.numero} · ${h.nombre}`,
    ]),
  )

  // Solo las cuya LLEGADA cae dentro del rango (criterio documentado arriba).
  const reservasCrudas = ((reservasTodas.data ?? []) as ReservaCruda[]).filter((r) => {
    const { llegada } = partirDuring(r.during)
    return llegada !== null && llegada >= rango.inicio && llegada <= rango.fin
  })
  const ticketsCrudos = (tickets.data ?? []) as TicketCrudo[]

  // Abonos TOTALES por destino (sin filtro de fecha): alimentan las columnas
  // abonado/saldo de cada reserva y pasadía del rango.
  const [abonosReservas, abonosTickets] = await Promise.all([
    abonosPorDestino(supabase, 'reservation_id', reservasCrudas.map((r) => r.id)),
    abonosPorDestino(supabase, 'ticket_id', ticketsCrudos.map((t) => t.id)),
  ])

  // Pagos REGISTRADOS en el rango (por created_at, UTC-5 fijo).
  const pagos = await supabase
    .from('payments')
    .select('reservation_id, ticket_id, monto, medio, created_at')
    .gte('created_at', `${rango.inicio}T00:00:00-05:00`)
    .lte('created_at', `${rango.fin}T23:59:59.999-05:00`)
    .order('created_at')
  if (pagos.error) throw new Error(`Error al leer los pagos: ${pagos.error.message}`)
  const pagosCrudos = (pagos.data ?? []) as PagoCrudo[]

  const filasReservas: FilaReserva[] = reservasCrudas.map((r) => {
    const { llegada, salida } = partirDuring(r.during)
    const valorTotal = r.valor_total === null ? null : redondear2(Number(r.valor_total))
    const abonado = abonosReservas.get(r.id) ?? 0
    return {
      codigo: r.codigo ?? '—',
      nombre: r.nombre,
      contacto: contactoDe(r.telefono, r.email),
      habitacion: (r.room_id && nombreHabitacion.get(r.room_id)) || '—',
      llegada: llegada ?? '—',
      salida: salida ?? '—',
      estado: r.estado,
      valorTotal,
      abonado,
      saldo: valorTotal === null ? null : redondear2(valorTotal - abonado),
    }
  })

  const filasPasadias: FilaPasadia[] = ticketsCrudos.map((t) => {
    const total = t.total_muestra === null ? null : redondear2(Number(t.total_muestra))
    const abonado = abonosTickets.get(t.id) ?? 0
    return {
      codigo: t.codigo,
      nombre: t.nombre,
      contacto: contactoDe(t.telefono, t.email),
      fecha: t.fecha,
      personas: t.personas,
      estado: t.estado,
      total,
      abonado,
      saldo: total === null ? null : redondear2(total - abonado),
      planes: describirLineas(t.lineas),
    }
  })

  // Códigos de los destinos que los pagos tocan y no vienen en las hojas
  // (pagos del rango para reservas que llegaron en otro rango).
  const codigoReserva = new Map(reservasCrudas.map((r) => [r.id, r.codigo ?? r.id]))
  const codigoTicket = new Map(ticketsCrudos.map((t) => [t.id, t.codigo]))
  const [faltanReservas, faltanTickets] = await Promise.all([
    codigosFaltantes(
      supabase,
      'reservations',
      [
        ...new Set(
          pagosCrudos
            .map((p) => p.reservation_id)
            .filter((id): id is string => id !== null && !codigoReserva.has(id)),
        ),
      ],
    ),
    codigosFaltantes(
      supabase,
      'tickets',
      [
        ...new Set(
          pagosCrudos
            .map((p) => p.ticket_id)
            .filter((id): id is string => id !== null && !codigoTicket.has(id)),
        ),
      ],
    ),
  ])

  const filasPagos: FilaPago[] = pagosCrudos.map((p) => ({
    fecha: fechaColombia(p.created_at),
    monto: redondear2(Number(p.monto ?? 0)),
    medio: p.medio ?? '—',
    destino: p.reservation_id ? 'Reserva' : p.ticket_id ? 'Pasadía' : '—',
    codigo: p.reservation_id
      ? (codigoReserva.get(p.reservation_id) ?? faltanReservas.get(p.reservation_id) ?? '—')
      : p.ticket_id
        ? (codigoTicket.get(p.ticket_id) ?? faltanTickets.get(p.ticket_id) ?? '—')
        : '—',
  }))

  // Resumen: solo activas suman a ingresos (solicitada+confirmada / no cancelado).
  const activasReservas = filasReservas.filter((r) => ESTADOS_ACTIVOS_RESERVA.includes(r.estado))
  const activasPasadias = filasPasadias.filter((p) => p.estado !== 'cancelado')

  const ingresosEsperados = redondear2(
    activasReservas.reduce((s, r) => s + (r.valorTotal ?? 0), 0) +
      activasPasadias.reduce((s, p) => s + (p.total ?? 0), 0),
  )
  const abonadoEnRango = redondear2(filasPagos.reduce((s, p) => s + p.monto, 0))
  const saldoPorCobrarRango = redondear2(
    activasReservas.reduce((s, r) => s + (r.saldo ?? 0), 0) +
      activasPasadias.reduce((s, p) => s + (p.saldo ?? 0), 0),
  )

  return {
    rango,
    resumen: {
      reservas: filasReservas.length,
      pasadias: filasPasadias.length,
      personasPasadia: activasPasadias.reduce((s, p) => s + p.personas, 0),
      ingresosEsperados,
      abonadoEnRango,
      saldoPendiente: redondear2(ingresosEsperados - abonadoEnRango),
      saldoPorCobrarRango,
    },
    reservas: filasReservas,
    pasadias: filasPasadias,
    pagos: filasPagos,
  }
}
