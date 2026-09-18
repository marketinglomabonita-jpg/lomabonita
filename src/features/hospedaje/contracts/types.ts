import { z } from 'zod'

/** Tipo de habitación (configuración) */
export type RoomType = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  capacidad_max: number
  cama: string | null
  precio_noche_muestra: number
  is_sample: boolean
  created_at: string
}

/** Instancia física de habitación */
export type Room = {
  id: string
  room_type_id: string
  nombre: string
  activa: boolean
  created_at: string
}

/** Bloqueo manual de disponibilidad */
export type RoomBlock = {
  id: string
  room_id: string
  during: string // daterange serializado como "[YYYY-MM-DD,YYYY-MM-DD)"
  motivo: string | null
  created_at: string
}

/** Estado de una reserva */
export type ReservationStatus = 'solicitada' | 'confirmada' | 'rechazada' | 'cancelada'

/** Reserva */
export type Reservation = {
  id: string
  codigo: string
  room_id: string | null
  during: string
  adultos: number
  ninos: number
  nombre: string
  email: string | null
  telefono: string | null
  notas: string | null
  estado: ReservationStatus
  created_at: string
}

/** Esquema de validación para la búsqueda de disponibilidad (query params) */
export const searchParamsSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // adultos/ninos pueden faltar en la URL cuando igualan el default de nuqs.
  adultos: z.coerce.number().int().positive().default(2),
  ninos: z.coerce.number().int().nonnegative().default(0),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

/** Esquema de validación para crear una reserva */
export const createReservationSchema = z.object({
  room_type_slug: z.string().min(1),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adultos: z.number().int().positive('Debe haber al menos 1 adulto'),
  ninos: z.number().int().nonnegative('Niños no puede ser negativo').default(0),
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  notas: z.string().optional(),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>

/** Notificación del panel */
export type Notification = {
  id: string
  tipo: 'reserva' | 'lead' | 'pedido' | 'sistema'
  titulo: string
  cuerpo: string | null
  ref_table: string | null
  ref_id: string | null
  leida: boolean
  created_at: string
}

/** Esquema para actualizar estado de reserva */
export const updateReservationStatusSchema = z.object({
  reservation_id: z.string().uuid(),
  nuevo_estado: z.enum(['confirmada', 'rechazada', 'cancelada']),
})

export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>

/** Esquema para crear/editar room_type */
export const roomTypeFormSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  capacidad_max: z.number().int().positive(),
  cama: z.string().optional(),
  precio_noche_muestra: z.number().positive(),
})

export type RoomTypeFormInput = z.infer<typeof roomTypeFormSchema>

/** Esquema para crear/editar room */
export const roomFormSchema = z.object({
  room_type_id: z.string().uuid(),
  nombre: z.string().min(1),
  activa: z.boolean().default(true),
})

export type RoomFormInput = z.infer<typeof roomFormSchema>

/** Esquema para crear room_block */
export const roomBlockFormSchema = z.object({
  room_id: z.string().uuid(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  motivo: z.string().optional(),
})

export type RoomBlockFormInput = z.infer<typeof roomBlockFormSchema>
