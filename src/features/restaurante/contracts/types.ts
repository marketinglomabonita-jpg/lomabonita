import { z } from 'zod'

// ============================================================================
// Domain types
// ============================================================================

export interface MenuCategory {
  id: string
  slug: string
  nombre: string
  orden: number
  is_sample: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  slug: string
  nombre: string
  descripcion: string | null
  precio_muestra: number
  disponible: boolean
  es_plato_del_dia: boolean
  is_sample: boolean
  created_at: string
}

export interface Order {
  id: string
  codigo: string
  mesa_numero: number
  items: OrderItem[]
  total: number
  estado: OrderEstado
  created_at: string
}

export type OrderEstado = 'recibido' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado'

export interface OrderItem {
  menu_item_id: string
  nombre: string
  cantidad: number
  precio: number
  notas?: string
}

export interface OrderStatus {
  estado: OrderEstado
  items: OrderItem[]
  total: number
  created_at: string
}

// ============================================================================
// Validation schemas
// ============================================================================

export const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  nombre: z.string().min(1),
  cantidad: z.number().int().min(1).max(20),
  precio: z.number().min(0),
  notas: z.string().max(200).optional(),
})

export const createOrderSchema = z.object({
  mesa_numero: z.number().int().min(1).max(50),
  items: z.array(orderItemSchema).min(1, 'El pedido debe tener al menos un ítem'),
  total: z.number().min(0),
})

export const updateOrderEstadoSchema = z.object({
  order_id: z.string().uuid(),
  estado: z.enum(['recibido', 'en_preparacion', 'listo', 'entregado', 'cancelado']),
})

// ============================================================================
// Admin schemas
// ============================================================================

export const createMenuItemSchema = z.object({
  category_id: z.string().uuid(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional(),
  precio_muestra: z.number().min(0),
  disponible: z.boolean().default(true),
  es_plato_del_dia: z.boolean().default(false),
})

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  id: z.string().uuid(),
})

export const togglePlatoDelDiaSchema = z.object({
  menu_item_id: z.string().uuid(),
})
