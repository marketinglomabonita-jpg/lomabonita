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
  adultos: z.coerce.number().int().positive(),
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
