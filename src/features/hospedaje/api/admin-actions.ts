'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/core/adapters/supabase/server'
import {
  updateReservationStatusSchema,
  roomTypeFormSchema,
  roomFormSchema,
  roomBlockFormSchema,
  type Reservation,
  type RoomType,
  type Room,
  type RoomBlock,
  type Notification,
} from '../contracts/types'

// ============================================================================
// Reservas
// ============================================================================

export async function listReservations(estado?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error al listar reservas: ${error.message}`)

  return data as Reservation[]
}

export async function updateReservationStatus(input: unknown) {
  const parsed = updateReservationStatusSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase
    .from('reservations')
    .update({ estado: parsed.nuevo_estado })
    .eq('id', parsed.reservation_id)

  if (error) throw new Error(`Error al actualizar reserva: ${error.message}`)

  revalidatePath('/admin/hospedaje')
  revalidatePath('/hospedaje')

  return { success: true }
}

// ============================================================================
// Room Types
// ============================================================================

export async function listRoomTypes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('room_types')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Error al listar tipos de habitación: ${error.message}`)

  return data as RoomType[]
}

export async function createRoomType(input: unknown) {
  const parsed = roomTypeFormSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.from('room_types').insert({
    ...parsed,
    is_sample: true, // Los datos del panel son ficticios
  })

  if (error) throw new Error(`Error al crear tipo de habitación: ${error.message}`)

  revalidatePath('/admin/hospedaje')
  revalidatePath('/hospedaje')

  return { success: true }
}

export async function updateRoomType(id: string, input: unknown) {
  const parsed = roomTypeFormSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.from('room_types').update(parsed).eq('id', id)

  if (error) throw new Error(`Error al actualizar tipo de habitación: ${error.message}`)

  revalidatePath('/admin/hospedaje')
  revalidatePath('/hospedaje')

  return { success: true }
}

// ============================================================================
// Rooms
// ============================================================================

export async function listRooms() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_types(*)')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Error al listar habitaciones: ${error.message}`)

  return data as (Room & { room_types: RoomType })[]
}

export async function createRoom(input: unknown) {
  const parsed = roomFormSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.from('rooms').insert(parsed)

  if (error) throw new Error(`Error al crear habitación: ${error.message}`)

  revalidatePath('/admin/hospedaje')
  revalidatePath('/hospedaje')

  return { success: true }
}

export async function updateRoom(id: string, input: unknown) {
  const parsed = roomFormSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.from('rooms').update(parsed).eq('id', id)

  if (error) throw new Error(`Error al actualizar habitación: ${error.message}`)

  revalidatePath('/admin/hospedaje')
  revalidatePath('/hospedaje')

  return { success: true }
}

// ============================================================================
// Room Blocks
// ============================================================================

export async function listRoomBlocks() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('room_blocks')
    .select('*, rooms(*)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al listar bloqueos: ${error.message}`)

  return data as (RoomBlock & { rooms: Room })[]
}

export async function createRoomBlock(input: unknown) {
  const parsed = roomBlockFormSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.from('room_blocks').insert({
    room_id: parsed.room_id,
    during: `[${parsed.fecha_inicio},${parsed.fecha_fin})`,
    motivo: parsed.motivo || null,
  })

  if (error) throw new Error(`Error al crear bloqueo: ${error.message}`)

  revalidatePath('/admin/hospedaje')
  revalidatePath('/hospedaje')

  return { success: true }
}

export async function deleteRoomBlock(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('room_blocks').delete().eq('id', id)

  if (error) throw new Error(`Error al eliminar bloqueo: ${error.message}`)

  revalidatePath('/admin/hospedaje')
  revalidatePath('/hospedaje')

  return { success: true }
}

// ============================================================================
// Notificaciones
// ============================================================================

export async function listNotifications(limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Error al listar notificaciones: ${error.message}`)

  return data as Notification[]
}

export async function countUnreadNotifications() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('leida', false)

  if (error) throw new Error(`Error al contar notificaciones: ${error.message}`)

  return count || 0
}

export async function markNotificationAsRead(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').update({ leida: true }).eq('id', id)

  if (error) throw new Error(`Error al marcar notificación: ${error.message}`)

  revalidatePath('/admin')

  return { success: true }
}
