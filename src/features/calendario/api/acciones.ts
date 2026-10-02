'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/core/adapters/supabase/server'
import { createAdminClient } from '@/core/adapters/supabase/admin'
import {
  habitacionesLibres,
  type HabitacionLibre,
  type LineaPasadia,
} from './dia'
import {
  ROLES_AGENDA,
  fechaISO,
  registrarEnAuditoria,
  requerirStaff,
  revalidarCalendario,
  type Resultado,
} from './comunes'

/** Comprobante de pago: imagen o PDF, máximo 5 MB. Guardado en bucket privado. */
const COMPROBANTE_TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const COMPROBANTE_MAX_BYTES = 5 * 1024 * 1024

/**
 * Extrae el File del comprobante del input crudo (antes de Zod, que lo descarta).
 * Lo busca anidado en `abono.comprobante` (flujo de crear) y también a nivel
 * raíz en `comprobante` (flujo de abono sobre reserva/pasadía existente).
 */
function extraerComprobante(input: unknown): File | null {
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

/** URL firmada (temporal) para ver un comprobante privado. Solo staff. */
export async function urlComprobante(path: unknown): Promise<string | null> {
  if (typeof path !== 'string' || path.trim() === '') return null
  await requerirStaff(ROLES_AGENDA)
  const admin = createAdminClient()
  const { data } = await admin.storage.from('comprobantes').createSignedUrl(path, 120)
  return data?.signedUrl ?? null
}

/**
 * Creación desde el día del calendario (R3): reservas de alojamiento y
 * pasadías. La verdad final del no-cruce y del cupo vive en la BD:
 *  - restricción de exclusión de reservations → error 23P01 al cruzar;
 *  - trigger de cupo de tickets → excepción P0001 con mensaje CUPO_AGOTADO:.
 * Este código solo filtra la UI (ofrecer habitaciones libres) y TRADUCE
 * esos errores a mensajes claros; nunca los reimplementa.
 */

/**
 * Correo del CLIENTE (opcional): ausente, vacío o solo espacios → null (la
 * columna es nullable); si viene, debe ser un email válido. Se guarda en
 * reservations.email / tickets.email.
 */
const emailClienteSchema = z.preprocess(
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

const abonoSchema = z.object({
  monto: z.coerce
    .number({ invalid_type_error: 'El monto del abono debe ser un número' })
    .positive('El monto del abono debe ser mayor a 0')
    .max(999_999_999, 'El monto del abono excede el máximo permitido'),
  medio: z.enum(MEDIOS_ABONO, { message: 'Elige un medio de pago válido' }),
})

/**
 * Experiencias sumables a una reserva (R4.A): SOLO Balsaje y Cascadas. Relax
 * va incluido en el alojamiento (no es extra) y Racing queda fuera hasta
 * definir su tarifa. El precio es EDITABLE ("tarifa por confirmar"): se
 * respeta el enviado (solo se exige ≥ 0, no se fuerza al precio de pasadía);
 * el nombre y el subtotal los arma el servidor para el jsonb `extras`.
 */
const SLUGS_EXTRA = ['loma-aventura-balsaje', 'loma-aventura-cascadas'] as const

const NOMBRES_EXTRA: Record<(typeof SLUGS_EXTRA)[number], string> = {
  'loma-aventura-balsaje': 'Loma Aventura Balsaje',
  'loma-aventura-cascadas': 'Loma Aventura Cascadas',
}

const extraReservaSchema = z.object({
  plan: z.enum(SLUGS_EXTRA, {
    message: 'Hay un extra no disponible: solo Balsaje o Cascadas se pueden sumar',
  }),
  personas: z.coerce
    .number({ invalid_type_error: 'Las personas del extra deben ser un número' })
    .int('Las personas del extra deben ser un número entero')
    .min(1, 'Cada extra necesita al menos 1 persona')
    .max(50, 'Cantidad de personas del extra fuera de rango'),
  // Tarifa editable: vacío NO es 0 (regalaría el extra); es un error claro.
  precio: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? Number.NaN : Number(v)),
    z
      .number({ invalid_type_error: 'El precio del extra debe ser un número' })
      .min(0, 'El precio del extra no puede ser negativo')
      .max(999_999_999, 'El precio del extra excede el máximo permitido'),
  ),
})

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
    email: emailClienteSchema,
    // Opcional: vacío → null (la reserva nace "por definir" y el saldo en
    // vivo del formulario lo refleja). Ya incluye los extras sumados (R4.A):
    // sigue siendo editable y solo se exige que no sea negativo.
    valor_total: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
      z
        .number({ invalid_type_error: 'El valor total debe ser un número' })
        .min(0, 'El valor total no puede ser negativo')
        .nullable(),
    ),
    // Experiencias adicionales (R4.A): desglose opcional que el formulario
    // envía; el subtotal y el nombre los arma el servidor (un jsonb por plan).
    extras: z.array(extraReservaSchema).max(2, 'Demasiados extras en una misma reserva').optional(),
    // Abono opcional al crear (R3.1a): llega solo si el toggle quedó activo.
    abono: abonoSchema.optional(),
  })
  .refine((d) => d.llegada < d.salida, {
    message: 'La salida debe ser posterior a la llegada',
    path: ['salida'],
  })

/** Una línea del grupo combinado (R4): un plan y cuántas personas van en él. */
const lineaPasadiaSchema = z.object({
  plan: z.string().trim().min(1, 'Elige un plan de pasadía en cada línea'),
  personas: z.coerce
    .number({ invalid_type_error: 'Las personas deben ser un número' })
    .int('Las personas deben ser un número entero')
    .min(1, 'Cada línea necesita al menos 1 persona')
    .max(200, 'Cantidad de personas fuera de rango'),
})

const crearPasadiaSchema = z
  .object({
    fecha: fechaISO,
    // Pasadías combinadas: el grupo puede mezclar planes (R4). Aquí SOLO se
    // validan plan y personas; los subtotales y el total los recalcula el
    // SERVIDOR con precios de pass_products — el dinero del cliente se ignora.
    lineas: z
      .array(lineaPasadiaSchema)
      .min(1, 'Agrega al menos un plan al grupo')
      .max(20, 'Demasiadas líneas en un mismo grupo'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
    telefono: z.string().trim().min(1, 'El teléfono es obligatorio').max(40),
    email: emailClienteSchema,
    abono: abonoSchema.optional(),
  })
  .refine((d) => d.lineas.reduce((suma, l) => suma + l.personas, 0) <= 200, {
    message: 'El grupo supera el máximo de 200 personas',
    path: ['lineas'],
  })

const rangoLibreSchema = z
  .object({ checkIn: fechaISO, checkOut: fechaISO })
  .refine((d) => d.checkIn < d.checkOut, {
    message: 'La salida debe ser posterior a la llegada',
  })

/** Código público único: prefijo + 6 caracteres sin ambigüedades. */
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generarCodigo(prefijo: string): string {
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
async function insertarAbonoYAuditar(
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
 * Crea una reserva de alojamiento confirmada, con sus extras opcionales
 * (R4.A: Balsaje/Cascadas con precio editable, guardados en reservations.extras
 * y ya sumados al valor_total que envía el formulario). Devuelve error legible
 * si la habitación se cruzó (23P01 de la restricción de exclusión de la BD).
 */
export async function crearReservaAlojamiento(input: unknown): Promise<Resultado> {
  const parsed = crearReservaSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data
  const comprobante = extraerComprobante(input)

  // Desglose definitivo de los extras (R4.A): nombre del servidor y subtotal
  // recalculado aquí (personas × precio). El valor_total ya viene con los
  // extras sumados desde el formulario — sigue siendo editable y no se toca.
  const lineasExtras = (d.extras ?? []).map((extra) => ({
    plan: extra.plan,
    nombre: NOMBRES_EXTRA[extra.plan],
    personas: extra.personas,
    precio: extra.precio,
    subtotal: Math.round(extra.personas * extra.precio * 100) / 100,
  }))

  // Uniques de codigo pueden chocar por azar: pocos reintentos alcanzan.
  const MAX_INTENTOS = 3
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const codigo = generarCodigo('R')

    // El id se lee de vuelta porque payments.reservation_id apunta al UUID,
    // no al código (único .select() necesario, no es para auditar).
    const { data: creada, error } = await supabase
      .from('reservations')
      .insert({
        codigo,
        room_id: d.room_id,
        during: `[${d.llegada},${d.salida})`, // llegada inclusiva, salida exclusiva
        adultos: d.adultos,
        ninos: d.ninos,
        nombre: d.nombre,
        telefono: d.telefono,
        email: d.email,
        estado: 'confirmada',
        valor_total: d.valor_total,
        extras: lineasExtras,
      })
      .select('id')
      .single()

    if (!error && creada) {
      // Abono al crear (R3.1a): si el insert del pago falla, la reserva YA
      // existe — se informa como aviso, no como error de la creación.
      let aviso: string | undefined
      if (d.abono) {
        const falloAbono = await insertarAbonoYAuditar(
          supabase,
          { id: userId, email: actorEmail },
          { reservationId: creada.id, codigo },
          d.abono,
          comprobante,
        )
        if (falloAbono) {
          aviso = `La reserva se creó, pero no se pudo registrar el abono: ${falloAbono}`
        }
      }

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
          extras: lineasExtras,
        },
      })
      revalidarCalendario(d.llegada)
      return aviso ? { success: true, aviso } : { success: true }
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
 * Emite UN ticket para TODO el grupo de pasadía (R4): el grupo puede combinar
 * planes (líneas plan+personas). El dinero lo calcula el SERVIDOR: para cada
 * línea busca el precio real en pass_products (is_sample=false) y hace
 * subtotal = personas × precio; el total es la suma. El ticket guarda
 * personas = Σ líneas (la base del cupo), total_muestra = Σ subtotales y el
 * desglose en el jsonb lineas. Devuelve error legible si el trigger de cupo de
 * la BD lo rechaza (P0001 / mensaje CUPO_AGOTADO).
 */
export async function crearPasadia(input: unknown): Promise<Resultado> {
  const parsed = crearPasadiaSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data
  const comprobante = extraerComprobante(input)

  // Precio real de cada plan involucrado, en una sola consulta.
  const slugs = [...new Set(d.lineas.map((l) => l.plan))]
  const { data: planes, error: errorPlanes } = await supabase
    .from('pass_products')
    .select('slug, nombre, precio_persona_muestra')
    .in('slug', slugs)
    .eq('is_sample', false)

  if (errorPlanes) {
    return { success: false, error: `No se pudieron consultar los planes: ${errorPlanes.message}` }
  }

  const precioYNombre = new Map(
    ((planes ?? []) as Array<{
      slug: string
      nombre: string
      precio_persona_muestra: number | null
    }>).map((p) => [p.slug, { precio: Number(p.precio_persona_muestra), nombre: p.nombre }]),
  )

  // Desglose definitivo; un plan inexistente (o sin precio) rechaza TODO el
  // grupo antes de tocar tickets.
  const desglose: LineaPasadia[] = []
  for (const linea of d.lineas) {
    const plan = precioYNombre.get(linea.plan)
    if (!plan || !Number.isFinite(plan.precio)) {
      return { success: false, error: 'El plan de pasadía elegido no existe' }
    }
    desglose.push({
      plan: linea.plan,
      nombre: plan.nombre,
      personas: linea.personas,
      precio_persona: plan.precio,
      subtotal: Math.round(linea.personas * plan.precio * 100) / 100,
    })
  }

  const personasTotales = desglose.reduce((suma, l) => suma + l.personas, 0)
  const total = Math.round(desglose.reduce((suma, l) => suma + l.subtotal, 0) * 100) / 100

  const MAX_INTENTOS = 3
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const codigo = generarCodigo('PD')

    // El id se lee de vuelta porque payments.ticket_id apunta al UUID (mismo
    // único .select() necesario que en reservations).
    const { data: emitido, error } = await supabase
      .from('tickets')
      .insert({
        codigo,
        fecha: d.fecha,
        personas: personasTotales,
        addons: [],
        lineas: desglose,
        total_muestra: total,
        nombre: d.nombre,
        telefono: d.telefono,
        email: d.email,
        estado: 'emitido',
      })
      .select('id')
      .single()

    if (!error && emitido) {
      // Abono al crear: mismo trato que en reservas (aviso si el pago falla).
      let aviso: string | undefined
      if (d.abono) {
        const falloAbono = await insertarAbonoYAuditar(
          supabase,
          { id: userId, email: actorEmail },
          { ticketId: emitido.id, codigo },
          d.abono,
          comprobante,
        )
        if (falloAbono) {
          aviso = `La pasadía se emitió, pero no se pudo registrar el abono: ${falloAbono}`
        }
      }

      await registrarEnAuditoria(supabase, {
        actorId: userId,
        actorEmail,
        action: 'pasadia.crear',
        entity: 'ticket',
        entityId: codigo,
        summary: {
          codigo,
          fecha: d.fecha,
          lineas: desglose,
          personas: personasTotales,
          total_muestra: total,
        },
      })
      revalidarCalendario(d.fecha)
      return aviso ? { success: true, aviso } : { success: true }
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

const registrarAbonoSchema = z
  .object({
    reservationId: z.string().uuid('Reserva inválida').optional(),
    ticketId: z.string().uuid('Pasadía inválida').optional(),
    monto: abonoSchema.shape.monto,
    medio: abonoSchema.shape.medio,
  })
  .refine((d) => Boolean(d.reservationId) !== Boolean(d.ticketId), {
    message: 'El abono debe apuntar a una reserva o a una pasadía, no a ambos ni a ninguno',
    path: ['reservationId'],
  })

/**
 * Suma un abono a una reserva o pasadía YA existente (R3.1a): mismo trato que
 * el abono al crear — solo INSERT en payments + auditoría + revalidación
 * staff. Lee la fecha del destino (único select necesario) para revalidar la
 * página del día correcta, donde vive el saldo.
 */
export async function registrarAbono(input: unknown): Promise<Resultado> {
  const parsed = registrarAbonoSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { supabase, userId, email: actorEmail } = await requerirStaff(ROLES_AGENDA)
  const d = parsed.data

  // Fecha y código del destino para revalidar el día y auditar con el código
  // legible (R-XXXXXX / PD-XXXXXX); si no se encontrara, quedan el UUID y una
  // revalidación genérica de la vista Mes.
  let fecha: string | null = null
  let codigoDestino = d.reservationId ?? d.ticketId ?? ''
  if (d.reservationId) {
    const { data } = await supabase
      .from('reservations')
      .select('codigo, during')
      .eq('id', d.reservationId)
      .maybeSingle()
    if (data) {
      codigoDestino = data.codigo ?? codigoDestino
      // during "[2026-10-01,2026-10-05)": la llegada ocupa los chars 1..10.
      fecha = data.during.slice(1, 11)
    }
  } else if (d.ticketId) {
    const { data } = await supabase
      .from('tickets')
      .select('codigo, fecha')
      .eq('id', d.ticketId)
      .maybeSingle()
    if (data) {
      codigoDestino = data.codigo ?? codigoDestino
      fecha = data.fecha
    }
  }

  const abono = { monto: d.monto, medio: d.medio }
  const comprobante = extraerComprobante(input)
  const fallo = d.reservationId
    ? await insertarAbonoYAuditar(
        supabase,
        { id: userId, email: actorEmail },
        { reservationId: d.reservationId, codigo: codigoDestino },
        abono,
        comprobante,
      )
    : d.ticketId
      ? await insertarAbonoYAuditar(
          supabase,
          { id: userId, email: actorEmail },
          { ticketId: d.ticketId, codigo: codigoDestino },
          abono,
          comprobante,
        )
      : 'Falta el destino del abono' // inalcanzable: el refine lo garantiza

  if (fallo) return { success: false, error: `No se pudo registrar el abono: ${fallo}` }

  if (fecha) revalidarCalendario(fecha)
  else revalidatePath('/admin/calendario')

  return { success: true }
}
