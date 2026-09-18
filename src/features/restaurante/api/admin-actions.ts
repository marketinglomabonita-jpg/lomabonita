'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/core/adapters/supabase/server'
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateOrderEstadoSchema,
  togglePlatoDelDiaSchema,
  type Order,
  type MenuItem,
} from '../contracts/types'

// ============================================================================
// Pedidos (KDS + historial)
// ============================================================================

export async function listOrders(filtro?: {
  estado?: string
  fecha?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (filtro?.estado) {
    query = query.eq('estado', filtro.estado)
  }
  if (filtro?.fecha) {
    const inicio = `${filtro.fecha}T00:00:00`
    const fin = `${filtro.fecha}T23:59:59`
    query = query.gte('created_at', inicio).lte('created_at', fin)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error al listar pedidos: ${error.message}`)

  return data as Order[]
}

export async function updateOrderEstado(
  input: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = updateOrderEstadoSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ estado: parsed.estado })
    .eq('id', parsed.order_id)

  if (error) throw new Error(`Error al actualizar estado del pedido: ${error.message}`)

  revalidatePath('/cocina')
  return { success: true }
}

// ============================================================================
// Carta (CRUD)
// ============================================================================

export async function listMenuItems() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) throw new Error(`Error al listar ítems del menú: ${error.message}`)

  return data as MenuItem[]
}

export async function createMenuItem(input: unknown) {
  const parsed = createMenuItemSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.from('menu_items').insert({
    ...parsed,
    is_sample: false,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un ítem con ese slug')
    }
    throw new Error(`Error al crear ítem: ${error.message}`)
  }

  revalidatePath('/restaurante')
  revalidatePath('/admin/restaurante')
}

export async function updateMenuItem(input: unknown) {
  const parsed = updateMenuItemSchema.parse(input)
  const { id, ...resto } = parsed
  const supabase = await createClient()

  const { error } = await supabase
    .from('menu_items')
    .update(resto)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un ítem con ese slug')
    }
    throw new Error(`Error al actualizar ítem: ${error.message}`)
  }

  revalidatePath('/restaurante')
  revalidatePath('/admin/restaurante')
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error al eliminar ítem: ${error.message}`)

  revalidatePath('/restaurante')
  revalidatePath('/admin/restaurante')
}

/**
 * Marca/desmarca un ítem como plato del día. Solo puede haber uno activo
 * a la vez: primero desmarca todos, luego marca el elegido.
 */
export async function togglePlatoDelDia(input: unknown) {
  const parsed = togglePlatoDelDiaSchema.parse(input)
  const supabase = await createClient()

  // Desmarcar todos primero
  await supabase
    .from('menu_items')
    .update({ es_plato_del_dia: false })
    .eq('es_plato_del_dia', true)

  // Marcar el elegido
  const { error } = await supabase
    .from('menu_items')
    .update({ es_plato_del_dia: true })
    .eq('id', parsed.menu_item_id)

  if (error) throw new Error(`Error al marcar plato del día: ${error.message}`)

  revalidatePath('/restaurante')
  revalidatePath('/admin/restaurante')
}
