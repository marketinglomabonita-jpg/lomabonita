'use server'

import { createClient } from '@/core/adapters/supabase/browser'
import {
  createOrderSchema,
  type MenuCategory,
  type MenuItem,
  type OrderStatus,
} from '../contracts/types'

// ============================================================================
// Carta pública
// ============================================================================

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .order('orden', { ascending: true })

  if (error) throw new Error(`Error al cargar categorías: ${error.message}`)

  return data as MenuCategory[]
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('disponible', true)
    .order('nombre', { ascending: true })

  if (error) throw new Error(`Error al cargar ítems del menú: ${error.message}`)

  return data as MenuItem[]
}

export async function getPlatoDelDia(): Promise<MenuItem | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('es_plato_del_dia', true)
    .eq('disponible', true)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Error al cargar plato del día: ${error.message}`)

  return data as MenuItem | null
}

// ============================================================================
// Pedido del comensal (anon)
// ============================================================================

/**
 * Crea un pedido desde la mesa. El código se genera ANTES del insert e
 * incluye en el payload (NO `.select()` tras el insert, porque anon solo
 * tiene policy de INSERT, no SELECT — aprendizaje Fase 6).
 */
export async function createOrder(
  input: unknown,
): Promise<
  { success: true; codigo: string } | { success: false; error: string }
> {
  const parsed = createOrderSchema.parse(input)
  const supabase = createClient()

  // Generar código ANTES del insert
  const codigo = `OR-${Date.now().toString(36).toUpperCase().slice(-6)}`

  // Validar total en el servidor (recalcular)
  const totalCalculado = parsed.items.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  )

  if (Math.abs(totalCalculado - parsed.total) > 0.01) {
    return {
      success: false,
      error: 'El total del pedido no coincide con los ítems',
    }
  }

  const { error } = await supabase.from('orders').insert({
    codigo,
    mesa_numero: parsed.mesa_numero,
    items: parsed.items as unknown as string, // jsonb
    total: parsed.total,
    estado: 'recibido',
  })
  // NO .select() aquí — anon no puede leer la tabla

  if (error) {
    if (error.code === '42501') {
      return {
        success: false,
        error: 'No tienes permisos para realizar esta acción',
      }
    }
    throw new Error(`Error al crear pedido: ${error.message}`)
  }

  return { success: true, codigo }
}

/**
 * Consulta el estado de un pedido por código (RPC pública, security definer).
 * El comensal hace polling de esta función cada ~4s para ver el progreso.
 */
export async function getOrderStatus(codigo: string): Promise<OrderStatus | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .rpc('get_order_status', { p_codigo: codigo })
    .maybeSingle()

  if (error) throw new Error(`Error al consultar estado del pedido: ${error.message}`)

  return data as OrderStatus | null
}
