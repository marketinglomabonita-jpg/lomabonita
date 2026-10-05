'use server'

import { z } from 'zod'
import {
  ROLES_AGENDA,
  abonoSchema,
  emailClienteSchema,
  extraerComprobante,
  fechaISO,
  generarCodigo,
  insertarAbonoYAuditar,
  registrarEnAuditoria,
  requerirStaff,
  revalidarCalendario,
  type Resultado,
} from './comunes'

/**
 * Reservas de GRUPO: Casa Llena (todas las habitaciones activas) y Grupal
 * (las habitaciones elegidas + nº de participantes), ambas a un solo titular
 * y gestionables como bloque desde el calendario.
 *
 * Cada habitación del grupo sigue siendo UNA fila de reservations y todas
 * comparten un `grupo_id` nuevo; el dinero del grupo (valor_total, abonos) y
 * las personas viven SOLO en la fila representante (la habitación de menor
 * `numero`). El no-cruce lo garantiza la BD igual que siempre: las filas se
 * insertan en UNA sola sentencia (atómica: el grupo entra completo o no
 * entra) y la restricción de exclusión lanza 23P01 si cualquier habitación
 * ya está ocupada en el rango. Aquí ese error solo se TRADUCE, nunca se
 * re-verifica en JS (habría carreras). Mismos guardas que el resto:
 * `requerirStaff(ROLES_AGENDA)` + Zod + auditoría + revalidación.
 */

/** Teléfono opcional del titular: vacío o solo espacios → nada que guardar. */
const telefonoOpcional = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().min(1, 'El teléfono no puede quedar en blanco').max(40).optional(),
)

/** Valor acordado del grupo: opcional, vacío → null ("por definir"), ≥ 0. */
const valorTotalOpcional = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z
    .number({ invalid_type_error: 'El valor total debe ser un número' })
    .min(0, 'El valor total no puede ser negativo')
    .max(999_999_999, 'El valor total excede el máximo permitido')
    .nullable(),
)

/** Titular del grupo: quien firma el bloque y dónde vive el dinero. */
const titularGrupo = {
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  telefono: telefonoOpcional,
  email: emailClienteSchema,
  valor_total: valorTotalOpcional,
  abono: abonoSchema.optional(),
}

const crearCasaLlenaSchema = z
  .object({
    llegada: fechaISO,
    salida: fechaISO,
    ...titularGrupo,
  })
  .refine((d) => d.llegada < d.salida, {
    message: 'La salida debe ser posterior a la llegada',
    path: ['salida'],
  })

const crearReservaGrupalSchema = z
  .object({
    llegada: fechaISO,
    salida: fechaISO,
    roomIds: z
      .array(z.string().uuid('Habitación inválida'))
      .min(1, 'Elige al menos una habitación')
      .max(20, 'Demasiadas habitaciones para un mismo grupo'),
    participantes: z.coerce
      .number({ invalid_type_error: 'Los participantes deben ser un número' })
      .int('Los participantes deben ser un número entero')
      .min(1, 'El grupo necesita al menos 1 participante')
      .max(200, 'Cantidad de participantes fuera de rango'),
    ...titularGrupo,
  })
  .refine((d) => d.llegada < d.salida, {
    message: 'La salida debe ser posterior a la llegada',
    path: ['salida'],
  })

const grupoIdSchema = z.object({ grupo_id: z.string().uuid('Grupo inválido') })

/** Mensaje de fallo de Zod (el primero) o el genérico, como en gestion.ts. */
function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos inválidos'
}

/** Habitación que entra al grupo, con lo que cada fila necesita de ella. */
type HabitacionParaGrupo = { id: string; numero: number; capacidad: number | null }

/**
 * Inserta TODAS las filas del grupo en UNA sola sentencia (atómica ante la
 * restricción de exclusión: o todas o ninguna) y hace lo común del cierre:
 * abono opcional sobre la fila representante, auditoría y revalidación.
 * `habitaciones` DEBE venir ordenada por `numero` (la primera es la
 * representante, la única que lleva valor_total y participantes).
 */
async function insertarGrupo(
  supabase: Awaited<ReturnType<typeof requerirStaff>>['supabase'],
  actor: { id: string; email: string },
  params: {
    habitaciones: HabitacionParaGrupo[]
    grupoTipo: 'casa_llena' | 'grupal'
    llegada: string
    salida: string
    nombre: string
    telefono?: string
    email: string | null
    valorTotal: number | null
    participantes: number | null
    abono?: { monto: number; medio: string }
    comprobante?: File | null
    errorSolape: string
  },
): Promise<Resultado> {
  const grupoId = crypto.randomUUID()
  const representante = params.habitaciones[0]
  const during = `[${params.llegada},${params.salida})`

  // Código único por fila: un choque 23505 reintenta TODO el bloque (mismo
  // grupo, nuevos códigos). Pocos reintentos alcanzan, como en acciones.ts.
  const MAX_INTENTOS = 3
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const filas = params.habitaciones.map((h) => ({
      codigo: generarCodigo('R'),
      room_id: h.id,
      during,
      // El grupo ocupa cada habitación completa: adultos = SU capacidad.
      adultos: h.capacidad ?? 2,
      ninos: 0,
      nombre: params.nombre,
      telefono: params.telefono ?? null,
      email: params.email,
      estado: 'confirmada',
      extras: [],
      grupo_id: grupoId,
      grupo_tipo: params.grupoTipo,
      // El dinero y las personas del grupo viven SOLO en la representante.
      valor_total: h.id === representante.id ? params.valorTotal : null,
      participantes: h.id === representante.id ? params.participantes : null,
    }))

    // UN solo insert multi-fila: una sola sentencia = atómico. Si cualquier
    // habitación cruza otra reserva, la BD rechaza TODO (23P01) y no queda
    // nada a medias.
    const { data: creadas, error } = await supabase
      .from('reservations')
      .insert(filas)
      .select('id, codigo, room_id')

    if (!error && creadas) {
      // La representante se identifica por room_id, no por orden de vuelta.
      const filaRepresentante = (
        creadas as Array<{ id: string; codigo: string | null; room_id: string | null }>
      ).find((r) => r.room_id === representante.id)

      // Abono al crear, sobre la representante (donde vive el dinero): si el
      // pago falla, el grupo YA existe — se informa como aviso, no como error.
      let aviso: string | undefined
      if (params.abono && filaRepresentante) {
        const falloAbono = await insertarAbonoYAuditar(
          supabase,
          actor,
          {
            reservationId: filaRepresentante.id,
            codigo: filaRepresentante.codigo ?? '',
          },
          params.abono,
          params.comprobante,
        )
        if (falloAbono) {
          aviso = `El grupo se creó, pero no se pudo registrar el abono: ${falloAbono}`
        }
      }

      await registrarEnAuditoria(supabase, {
        actorId: actor.id,
        actorEmail: actor.email,
        action: params.grupoTipo === 'casa_llena' ? 'reserva.casa_llena' : 'reserva.grupal',
        entity: 'reservation',
        // Código de la representante: la fila legible que lleva el dinero.
        entityId: filaRepresentante?.codigo ?? grupoId,
        summary: {
          grupo_id: grupoId,
          grupo_tipo: params.grupoTipo,
          llegada: params.llegada,
          salida: params.salida,
          habitaciones: params.habitaciones.length,
          participantes: params.participantes,
          valor_total: params.valorTotal,
          codigos: (creadas as Array<{ codigo: string | null }>).map((r) => r.codigo),
        },
      })
      revalidarCalendario(params.llegada)
      return aviso ? { success: true, aviso } : { success: true }
    }

    // Solape real: la exclusión es la verdad final y no se creó NADA.
    if (error.code === '23P01') {
      return { success: false, error: params.errorSolape }
    }

    if (error.code === '23505' && intento < MAX_INTENTOS) continue // codigo repetido

    return { success: false, error: `No se pudo guardar el grupo: ${error.message}` }
  }

  return { success: false, error: 'No se pudo generar códigos únicos para el grupo' }
}

/**
 * Reserva la CASA COMPLETA (casa llena): una fila por cada habitación activa,
 * todas al mismo titular y rango, enlazadas por un `grupo_id` nuevo. NO se
 * pre-filtran habitaciones ocupadas en JS: el insert atómico + la restricción
 * de exclusión son la verdad — si cualquier habitación está ocupada en el
 * rango, la BD rechaza TODO el bloque y no se crea nada.
 */
export async function crearCasaLlena(input: unknown): Promise<Resultado> {
  const parsed = crearCasaLlenaSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data

  // TODAS las activas, ordenadas por numero: la primera es la representante.
  const { data: rooms, error: errorRooms } = await supabase
    .from('rooms')
    .select('id, numero, capacidad')
    .eq('activa', true)
    .order('numero')

  if (errorRooms) {
    return { success: false, error: `No se pudieron listar las habitaciones: ${errorRooms.message}` }
  }
  const habitaciones = [...((rooms ?? []) as HabitacionParaGrupo[])].sort(
    (a, b) => a.numero - b.numero,
  )
  if (habitaciones.length === 0) {
    return { success: false, error: 'No hay habitaciones activas para reservar la casa' }
  }

  return insertarGrupo(supabase, { id: userId, email: actorEmail }, {
    habitaciones,
    grupoTipo: 'casa_llena',
    llegada: d.llegada,
    salida: d.salida,
    nombre: d.nombre,
    telefono: d.telefono,
    email: d.email,
    valorTotal: d.valor_total,
    // La casa se entrega completa: cada fila llena SU capacidad; no hay un
    // número de participantes distinto de la suma de las habitaciones.
    participantes: null,
    abono: d.abono,
    comprobante: extraerComprobante(input),
    errorSolape:
      'La casa no está libre en esas fechas: hay habitaciones ocupadas. Elige otras fechas.',
  })
}

/**
 * Reserva GRUPAL: solo las habitaciones elegidas (`roomIds`), con el nº de
 * personas del grupo (`participantes`) viviendo en la fila representante.
 * Igual que la casa llena: insert atómico y 23P01 como verdad del no-cruce.
 */
export async function crearReservaGrupal(input: unknown): Promise<Resultado> {
  const parsed = crearReservaGrupalSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data

  // Sin duplicados: una fila por habitación elegida.
  const roomIds = [...new Set(d.roomIds)]

  const { data: rooms, error: errorRooms } = await supabase
    .from('rooms')
    .select('id, numero, capacidad')
    .eq('activa', true)
    .in('id', roomIds)
    .order('numero')

  if (errorRooms) {
    return { success: false, error: `No se pudieron listar las habitaciones: ${errorRooms.message}` }
  }
  const habitaciones = [...((rooms ?? []) as HabitacionParaGrupo[])].sort(
    (a, b) => a.numero - b.numero,
  )
  if (habitaciones.length !== roomIds.length) {
    return { success: false, error: 'Alguna de las habitaciones elegidas no existe o no está activa' }
  }

  return insertarGrupo(supabase, { id: userId, email: actorEmail }, {
    habitaciones,
    grupoTipo: 'grupal',
    llegada: d.llegada,
    salida: d.salida,
    nombre: d.nombre,
    telefono: d.telefono,
    email: d.email,
    valorTotal: d.valor_total,
    participantes: d.participantes,
    abono: d.abono,
    comprobante: extraerComprobante(input),
    errorSolape: 'Alguna de las habitaciones elegidas ya está ocupada en esas fechas.',
  })
}

/** Días de llegada distintos de las filas del grupo (qué páginas revalidar). */
function llegadasDeGrupo(filas: Array<{ during: string }>): string[] {
  return [...new Set(filas.map((f) => f.during.slice(1, 11)))]
}

/**
 * Cancela TODO el grupo (cada fila activa pasa a 'cancelada'): libera todas
 * las habitaciones del bloque sin borrar historial. Idempotente como
 * cancelarReserva: si ya no queda ninguna activa devuelve éxito con aviso y
 * no vuelve a auditar (nada cambió).
 */
export async function cancelarGrupo(input: unknown): Promise<Resultado> {
  const parsed = grupoIdSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const grupoId = parsed.data.grupo_id

  // El .in evita "revivir" o retocar filas ya cerradas; una fila ya cancelada
  // o eliminada no matchea y no se toca.
  const { data, error } = await supabase
    .from('reservations')
    .update({ estado: 'cancelada' })
    .eq('grupo_id', grupoId)
    .in('estado', ['solicitada', 'confirmada'])
    .select('codigo, during')

  if (error) return { success: false, error: `No se pudo cancelar el grupo: ${error.message}` }

  const canceladas = (data ?? []) as Array<{ codigo: string | null; during: string }>
  if (canceladas.length === 0) {
    const { data: existe } = await supabase
      .from('reservations')
      .select('id')
      .eq('grupo_id', grupoId)
      .limit(1)
    return existe && existe.length > 0
      ? { success: true, aviso: 'El grupo ya no tiene reservas activas' }
      : { success: false, error: 'No se encontró el grupo' }
  }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail: actorEmail,
    action: 'reserva.grupo.cancelar',
    entity: 'reservation',
    // Código de la primera fila del bloque como id legible del grupo.
    entityId: canceladas[0]?.codigo ?? grupoId,
    summary: {
      grupo_id: grupoId,
      estado_final: 'cancelada',
      reservas: canceladas.length,
      codigos: canceladas.map((f) => f.codigo),
      durante: canceladas[0]?.during,
    },
  })

  for (const fecha of llegadasDeGrupo(canceladas)) revalidarCalendario(fecha)
  return { success: true }
}

/**
 * Elimina el grupo DE VERDAD (DELETE de todas sus filas), para limpiar
 * bloques de prueba. Sus payments caen solos por la FK on delete cascade;
 * los archivos de comprobante del bucket no se tocan (limpieza manual).
 */
export async function eliminarGrupo(input: unknown): Promise<Resultado> {
  const parsed = grupoIdSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: primerError(parsed.error) }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const grupoId = parsed.data.grupo_id

  // Leer antes de borrar: qué había (para auditarlo) y qué días revalidar.
  const { data: previas } = await supabase
    .from('reservations')
    .select('codigo, during, estado')
    .eq('grupo_id', grupoId)

  const filas = (previas ?? []) as Array<{ codigo: string | null; during: string; estado: string }>
  if (filas.length === 0) return { success: false, error: 'No se encontró el grupo' }

  const { error } = await supabase.from('reservations').delete().eq('grupo_id', grupoId)
  if (error) return { success: false, error: `No se pudo eliminar el grupo: ${error.message}` }

  await registrarEnAuditoria(supabase, {
    actorId: userId,
    actorEmail: actorEmail,
    action: 'reserva.grupo.eliminar',
    entity: 'reservation',
    entityId: filas[0]?.codigo ?? grupoId,
    summary: {
      grupo_id: grupoId,
      reservas: filas.length,
      codigos: filas.map((f) => f.codigo),
      estados: filas.map((f) => f.estado),
    },
  })

  for (const fecha of llegadasDeGrupo(filas)) revalidarCalendario(fecha)
  return { success: true }
}
