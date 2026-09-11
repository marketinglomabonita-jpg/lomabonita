import { z } from 'zod'

/**
 * Cupo por defecto cuando una fecha no tiene fila en pass_capacity.
 * Debe coincidir con el default embebido en el trigger/RPC de la
 * migración 0009_fase5_pasadias.sql (coalesce(..., 60)).
 */
export const CAPACIDAD_DEFAULT_PASADIA = 60

/** Tope de personas por solicitud de ticket (el cupo por fecha se valida aparte). */
export const MAX_PERSONAS_TICKET = 40

/** Producto de pasadía (plan base) */
export type PassProduct = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  precio_persona_muestra: number
  is_sample: boolean
  created_at: string
}

/** Experiencia agregable al ticket */
export type Experience = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  precio_persona_muestra: number
  is_sample: boolean
  created_at: string
}

/** Estado de un ticket */
export type TicketStatus = 'emitido' | 'usado' | 'cancelado'

/** Ticket de pasadía */
export type Ticket = {
  id: string
  codigo: string
  fecha: string
  personas: number
  addons: string[]
  total_muestra: number
  nombre: string
  email: string | null
  telefono: string | null
  estado: TicketStatus
  created_at: string
}

/** Override de cupo por fecha */
export type PassCapacity = {
  id: string
  fecha: string
  cupo_maximo: number
  created_at: string
}

/** Esquema de validación para emitir un ticket */
export const createTicketSchema = z.object({
  product_slug: z.string().min(1, 'Elige un plan de pasadía'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  personas: z
    .number()
    .int()
    .min(1, 'Debe haber al menos 1 persona')
    .max(MAX_PERSONAS_TICKET, `Máximo ${MAX_PERSONAS_TICKET} personas por solicitud`),
  addons: z.array(z.string().min(1)).max(10).default([]),
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

/** Campos de contacto del paso 2 (se combinan con el estado del paso 1) */
export const ticketContactSchema = createTicketSchema.pick({
  nombre: true,
  email: true,
  telefono: true,
})

export type TicketContactInput = z.infer<typeof ticketContactSchema>

/** Fila de cupo usada por el panel: override + agregado real de tickets */
export type CapacityRow = {
  fecha: string
  cupo: number
  esDefault: boolean
  usado: number
  disponible: number
}

/** Esquema para el check-in de un ticket */
export const checkInTicketSchema = z.object({
  ticket_id: z.string().uuid(),
})

export type CheckInTicketInput = z.infer<typeof checkInTicketSchema>

/** Esquema para crear/actualizar el cupo de una fecha */
export const setCapacitySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  cupo_maximo: z.coerce
    .number()
    .int()
    .positive('El cupo debe ser mayor que 0')
    .max(1000, 'Cupo irreal'),
})

export type SetCapacityInput = z.infer<typeof setCapacitySchema>
