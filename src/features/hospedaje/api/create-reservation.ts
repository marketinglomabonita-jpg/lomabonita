'use server'

import { createClient } from '@/core/adapters/supabase/server'
import { createReservationSchema, type CreateReservationInput } from '../contracts/types'

type CreateReservationResult =
  | { success: true; codigo: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Crea una solicitud de reserva.
 *
 * Valida en servidor, asigna una room disponible del room_type elegido,
 * genera código único y persiste. La restricción de exclusión en BD
 * previene doble-booking; si falla (23P01), devuelve error de disponibilidad.
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  try {
    // 1. Validar con Zod
    const parsed = createReservationSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const data = parsed.data

    // 2. Validaciones de negocio
    if (data.check_in >= data.check_out) {
      return { success: false, error: 'La fecha de salida debe ser posterior a la de entrada' }
    }

    const totalPersonas = data.adultos + data.ninos

    const supabase = await createClient()

    // 3. Obtener el room_type y verificar aforo
    const { data: roomType, error: rtError } = await supabase
      .from('room_types')
      .select('*')
      .eq('slug', data.room_type_slug)
      .single()

    if (rtError || !roomType) {
      return { success: false, error: 'Tipo de habitación no encontrado' }
    }

    if (totalPersonas > roomType.capacidad_max) {
      return {
        success: false,
        error: `Esta habitación admite máximo ${roomType.capacidad_max} personas`,
      }
    }

    // 4. Buscar una room disponible de ese tipo
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_type_id', roomType.id)
      .eq('activa', true)

    if (!rooms || rooms.length === 0) {
      return { success: false, error: 'No hay habitaciones activas de este tipo' }
    }

    let availableRoomId: string | null = null

    for (const room of rooms) {
      // Verificar bloqueos
      const { data: blocks } = await supabase
        .from('room_blocks')
        .select('id')
        .eq('room_id', room.id)
        .overlaps('during', `[${data.check_in},${data.check_out})`)
        .limit(1)

      if (blocks && blocks.length > 0) continue

      // Verificar reservas existentes
      const { data: existingReservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', room.id)
        .in('estado', ['solicitada', 'confirmada'])
        .overlaps('during', `[${data.check_in},${data.check_out})`)
        .limit(1)

      if (!existingReservations || existingReservations.length === 0) {
        availableRoomId = room.id
        break
      }
    }

    if (!availableRoomId) {
      return {
        success: false,
        error: 'Esta habitación ya no está disponible para esas fechas',
      }
    }

    // 5. Generar código único
    const codigo = generateReservationCode()

    // 6. Insertar reserva
    const { error: insertError } = await supabase.from('reservations').insert({
      codigo,
      room_id: availableRoomId,
      during: `[${data.check_in},${data.check_out})`,
      adultos: data.adultos,
      ninos: data.ninos,
      nombre: data.nombre,
      email: data.email || null,
      telefono: data.telefono || null,
      notas: data.notas || null,
      estado: 'solicitada',
    })

    if (insertError) {
      // Error 23P01 = exclusion constraint violation
      if (insertError.code === '23P01') {
        return {
          success: false,
          error: 'Esa habitación ya no está disponible (otra reserva se procesó al mismo tiempo)',
        }
      }
      console.error('Error inserting reservation:', insertError)
      return { success: false, error: 'Error al crear la reserva' }
    }

    return { success: true, codigo }
  } catch (err) {
    console.error('Unexpected error in createReservation:', err)
    return { success: false, error: 'Error inesperado al procesar la solicitud' }
  }
}

/**
 * Genera un código de reserva único tipo "LB-XXXXXX" (6 dígitos aleatorios).
 */
function generateReservationCode(): string {
  const random = Math.floor(100000 + Math.random() * 900000)
  return `LB-${random}`
}
