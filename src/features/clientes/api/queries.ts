import { createClient } from '@/core/adapters/supabase/server'

// Próxima iteración (ver docs/investigacion-normativa-hoteleria.md): sumar a este
// tipo (y al listado del panel) la identificación y la procedencia del cliente,
// datos que exigirá la normativa de registro hotelero colombiana. Requiere
// migración: esas columnas aún no existen en reservations ni en tickets.
/**
 * Cliente consolidado para el CRM del panel. No existe una tabla `clients`:
 * cada cliente se reconstruye agrupando sus reservas de hospedaje y sus
 * tickets de pasadía por una clave de contacto estable.
 */
export type Cliente = {
  /** Clave de agrupación (`email:…` / `tel:…` / `nombre:…`), estable entre visitas. */
  clave: string
  nombre: string
  email: string | null
  telefono: string | null
  /** Reservas de hospedaje históricas (incluyen canceladas/rechazadas). */
  reservas: number
  /** Tickets de pasadía históricos (incluyen cancelados). */
  pasadias: number
  /** Fecha (YYYY-MM-DD en hora de Colombia) de su reserva o ticket más reciente. */
  ultimaActividad: string
}

/** Contacto mínimo que comparten reservations y tickets. */
type FilaContacto = {
  nombre: string | null
  telefono: string | null
  email: string | null
  created_at: string
}

/** Acumulado interno mientras se agrupan las filas. */
type Acumulado = Omit<Cliente, 'ultimaActividad'> & {
  /** created_at (timestamp completo) más reciente del grupo; sirve para ordenar. */
  ultima: string
}

/** Texto comparable: minúsculas, espacios colapsados y sin bordes vacíos. */
function normalizarTexto(valor: string | null): string {
  return (valor ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Teléfono a dígitos, retirando el indicativo colombiano si vino completo:
 * "+57 311 111 1111" y "3111111111" deben agrupar al mismo cliente.
 */
function normalizarTelefono(valor: string | null): string {
  const digitos = (valor ?? '').replace(/\D/g, '')
  if (digitos.length === 12 && digitos.startsWith('57')) return digitos.slice(2)
  return digitos
}

/**
 * Clave estable de un cliente: email si lo hay (la identidad más fuerte);
 * si no, teléfono normalizado; si no, nombre en minúsculas. El prefijo evita
 * colisiones entre espacios (un teléfono "311…" nunca choca con "311…@…").
 */
function claveDe(fila: FilaContacto): string {
  const email = normalizarTexto(fila.email)
  if (email) return `email:${email}`
  const telefono = normalizarTelefono(fila.telefono)
  if (telefono) return `tel:${telefono}`
  return `nombre:${normalizarTexto(fila.nombre)}`
}

/** Fecha YYYY-MM-DD de un timestamptz UTC en hora de Colombia (UTC-5 fijo). */
function fechaColombia(timestamptz: string): string {
  return new Date(Date.parse(timestamptz) - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/**
 * Todos los clientes conocidos, consolidados desde reservas y pasadías y
 * ordenados por su última actividad (la más reciente primero).
 *
 * Sin filtro de estado a propósito: este directorio es el histórico comercial
 * (un cliente que canceló sigue siendo alguien con quien recontactar), no un
 * reporte de ocupación — de eso se encargan las secciones de Hospedaje y
 * Pasadías con sus propios filtros.
 */
export async function getClientes(): Promise<Cliente[]> {
  const supabase = await createClient()

  const [reservas, tickets] = await Promise.all([
    supabase.from('reservations').select('nombre, telefono, email, created_at'),
    supabase.from('tickets').select('nombre, telefono, email, created_at'),
  ])

  if (reservas.error) throw new Error(`Error al listar reservas: ${reservas.error.message}`)
  if (tickets.error) throw new Error(`Error al listar tickets: ${tickets.error.message}`)

  // Orden cronológico ascendente: los datos de contacto más recientes pisan a
  // los viejos y los huecos (null) se conservan del primer registro que los trajo.
  const filas = [
    ...((reservas.data ?? []) as FilaContacto[]).map((f) => ({ ...f, esReserva: true })),
    ...((tickets.data ?? []) as FilaContacto[]).map((f) => ({ ...f, esReserva: false })),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at))

  const grupos = new Map<string, Acumulado>()

  for (const fila of filas) {
    const clave = claveDe(fila)
    const acc: Acumulado =
      grupos.get(clave) ??
      ({ clave, nombre: '', email: null, telefono: null, reservas: 0, pasadias: 0, ultima: '' })

    if (fila.esReserva) acc.reservas += 1
    else acc.pasadias += 1
    if (fila.nombre?.trim()) acc.nombre = fila.nombre.trim()
    if (fila.email?.trim()) acc.email = fila.email.trim()
    if (normalizarTelefono(fila.telefono)) acc.telefono = (fila.telefono ?? '').trim()
    acc.ultima = fila.created_at
    grupos.set(clave, acc)
  }

  return [...grupos.values()]
    .sort((a, b) => b.ultima.localeCompare(a.ultima) || a.nombre.localeCompare(b.nombre))
    .map(({ clave, nombre, email, telefono, reservas, pasadias, ultima }) => ({
      clave,
      nombre,
      email,
      telefono,
      reservas,
      pasadias,
      ultimaActividad: fechaColombia(ultima),
    }))
}
