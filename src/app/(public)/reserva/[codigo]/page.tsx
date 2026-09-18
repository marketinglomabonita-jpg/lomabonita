import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Calendar, Users, Home } from 'lucide-react'
import { createAdminClient } from '@/core/adapters/supabase/admin'
import { buildPageMetadata } from '@/core/lib/seo'
import { buttonVariants } from '@/core/ui/button'

type Props = {
  params: Promise<{ codigo: string }>
}

import { IMAGES } from '@/core/lib/images'

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Confirmación de solicitud',
    description: 'Tu solicitud de reserva ha sido recibida.',
    path: '/reserva',
    image: IMAGES['habitaciones-1-vertical'],
    imageAlt: 'Confirmación de reserva',
  }),
  robots: 'noindex',
}

export default async function ReservationConfirmationPage({ params }: Props) {
  const { codigo } = await params

  // Usar admin client para leer por código (la policy no permite SELECT a anon)
  const supabase = createAdminClient()
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*, rooms(nombre, room_types(nombre))')
    .eq('codigo', codigo)
    .single()

  if (error || !reservation) {
    notFound()
  }

  // Parsear daterange "[YYYY-MM-DD,YYYY-MM-DD)"
  const duringMatch = reservation.during.match(/\[([^,]+),([^)]+)\)/)
  if (!duringMatch) {
    notFound()
  }

  const checkIn = new Date(duringMatch[1])
  const checkOut = new Date(duringMatch[2])

  const estadoColors: Record<string, string> = {
    solicitada: 'bg-blue-100 text-blue-800',
    confirmada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    cancelada: 'bg-gray-100 text-gray-800',
  }

  const estadoLabels: Record<string, string> = {
    solicitada: 'Pendiente de confirmación',
    confirmada: 'Confirmada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-12">
      <div className="container max-w-2xl">
        <div className="space-y-6">
          {/* Header con ícono de éxito */}
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-16 text-green-600" aria-hidden="true" />
            <h1 className="mt-4 font-display text-3xl font-bold text-cafe">
              ¡Solicitud recibida!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Tu código de seguimiento es:{' '}
              <strong className="font-mono text-lg text-cafe">{reservation.codigo}</strong>
            </p>
          </div>

          {/* Card principal */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Detalles de la reserva</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoColors[reservation.estado]}`}
              >
                {estadoLabels[reservation.estado]}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Home className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium">
                    {reservation.rooms?.room_types?.nombre || 'Habitación'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reservation.rooms?.nombre || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">Fechas</p>
                  <p className="text-muted-foreground">
                    {format(checkIn, "d 'de' MMMM", { locale: es })} →{' '}
                    {format(checkOut, "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium">Huéspedes</p>
                  <p className="text-muted-foreground">
                    {reservation.adultos} adulto{reservation.adultos > 1 ? 's' : ''}
                    {reservation.ninos > 0 &&
                      ` + ${reservation.ninos} niño${reservation.ninos > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {reservation.nombre && (
                <div className="border-t border-border pt-4">
                  <p className="font-medium">Datos de contacto</p>
                  <p className="mt-1 text-muted-foreground">{reservation.nombre}</p>
                  {reservation.email && (
                    <p className="text-muted-foreground">{reservation.email}</p>
                  )}
                  {reservation.telefono && (
                    <p className="text-muted-foreground">{reservation.telefono}</p>
                  )}
                </div>
              )}

              {reservation.notas && (
                <div className="border-t border-border pt-4">
                  <p className="font-medium">Notas</p>
                  <p className="mt-1 text-muted-foreground">{reservation.notas}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje informativo */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium">¿Qué sigue?</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              <li>Nuestro equipo revisará tu solicitud en las próximas 24 horas.</li>
              <li>Te contactaremos para confirmar disponibilidad y coordinar el pago.</li>
              <li>Guarda tu código de seguimiento para consultar el estado de tu reserva.</li>
            </ul>
          </div>

          {/* Botón de regreso */}
          <div className="text-center">
            <Link href="/" className={buttonVariants()}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
