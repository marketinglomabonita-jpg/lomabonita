import { permanentRedirect } from 'next/navigation'

/**
 * La solicitud de reserva por habitacion (motor del demo) queda para la v3.
 * Mientras tanto las reservas son por WhatsApp y todo vive en /hospedaje.
 */
export default function RoomDetailPage() {
  permanentRedirect('/hospedaje#habitaciones')
}
