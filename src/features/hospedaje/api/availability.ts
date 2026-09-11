'use server'

import { createClient } from '@/core/adapters/supabase/server'
import type { RoomType } from '../contracts/types'

/**
 * Busca tipos de habitación disponibles para el rango de fechas y aforo.
 *
 * Un room_type está disponible si tiene ≥1 room activa cuyo rango NO solapa
 * ningún room_block ni ninguna reservation en estado solicitada/confirmada.
 */
export async function searchAvailability(params: {
  checkIn: string
  checkOut: string
  adultos: number
  ninos: number
}): Promise<{ roomTypes: RoomType[]; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Obtener todos los room_types que cumplen el aforo
    const totalPersonas = params.adultos + params.ninos
    const { data: roomTypes, error: rtError } = await supabase
      .from('room_types')
      .select('*')
      .gte('capacidad_max', totalPersonas)
      .order('precio_noche_muestra', { ascending: true })

    if (rtError) {
      console.error('Error fetching room_types:', rtError)
      return { roomTypes: [], error: 'Error al buscar tipos de habitación' }
    }

    if (!roomTypes || roomTypes.length === 0) {
      return { roomTypes: [], error: 'No hay habitaciones con ese aforo' }
    }

    // 2. Para cada room_type, verificar si tiene ≥1 room disponible
    const available: RoomType[] = []

    for (const rt of roomTypes) {
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_type_id', rt.id)
        .eq('activa', true)

      if (!rooms || rooms.length === 0) continue

      // 3. Verificar cuáles rooms NO tienen solapamientos
      let hasAvailableRoom = false

      for (const room of rooms) {
        // Buscar bloqueos que solapen
        const { data: blocks } = await supabase
          .from('room_blocks')
          .select('id')
          .eq('room_id', room.id)
          .overlaps('during', `[${params.checkIn},${params.checkOut})`)
          .limit(1)

        if (blocks && blocks.length > 0) continue

        // Buscar reservas que solapen
        const { data: reservations } = await supabase
          .from('reservations')
          .select('id')
          .eq('room_id', room.id)
          .in('estado', ['solicitada', 'confirmada'])
          .overlaps('during', `[${params.checkIn},${params.checkOut})`)
          .limit(1)

        if (!reservations || reservations.length === 0) {
          hasAvailableRoom = true
          break
        }
      }

      if (hasAvailableRoom) {
        available.push(rt)
      }
    }

    return { roomTypes: available }
  } catch (err) {
    console.error('Error in searchAvailability:', err)
    return { roomTypes: [], error: 'Error inesperado al buscar disponibilidad' }
  }
}
