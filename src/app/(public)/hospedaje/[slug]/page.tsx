import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { differenceInDays } from 'date-fns'
import { ArrowLeft, Check } from 'lucide-react'
import { createClient } from '@/core/adapters/supabase/server'
import { searchParamsSchema } from '@/features/hospedaje/contracts/types'
import { ReservationForm } from '@/features/hospedaje/components/reservation-form'
import { PageHero } from '@/features/marketing/components/page-hero'
import { buildPageMetadata } from '@/core/lib/seo'
import { buttonVariants } from '@/core/ui/button'
import { IMAGES } from '@/core/lib/images'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    checkIn?: string
    checkOut?: string
    adultos?: string
    ninos?: string
  }>
}

const ROOM_IMAGES: Record<string, { src: string; w: number; h: number }> = {
  'clasica-doble': IMAGES['habitaciones-3-vertical'],
  'confort-familiar': IMAGES['habitaciones-1-vertical'],
  'cabana-multiple': IMAGES['habitaciones-2-vertical'],
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: roomType } = await supabase
    .from('room_types')
    .select('nombre, descripcion')
    .eq('slug', slug)
    .single()

  const image = ROOM_IMAGES[slug] || IMAGES['habitaciones-1-vertical']

  if (!roomType) {
    return buildPageMetadata({
      title: 'Habitación no encontrada',
      description: 'La habitación que buscas no existe.',
      path: `/hospedaje/${slug}`,
      image,
      imageAlt: 'Habitación Loma Bonita',
    })
  }

  return buildPageMetadata({
    title: `${roomType.nombre} — Reserva en Loma Bonita`,
    description: roomType.descripcion || `Solicita tu reserva para ${roomType.nombre}`,
    path: `/hospedaje/${slug}`,
    image,
    imageAlt: roomType.nombre,
  })
}

export default async function RoomDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const search = await searchParams

  // Validar parámetros de búsqueda
  const parsed = searchParamsSchema.safeParse(search)
  if (!parsed.success) {
    redirect('/hospedaje')
  }

  const { checkIn, checkOut, adultos, ninos } = parsed.data

  // Buscar el room_type
  const supabase = await createClient()
  const { data: roomType, error } = await supabase
    .from('room_types')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !roomType) {
    notFound()
  }

  const totalPersonas = adultos + ninos
  if (totalPersonas > roomType.capacidad_max) {
    redirect('/hospedaje')
  }

  const nights = differenceInDays(new Date(checkOut), new Date(checkIn))
  const total = roomType.precio_noche_muestra * nights
  const image = ROOM_IMAGES[slug] || IMAGES['habitaciones-1-vertical']

  return (
    <>
      <PageHero
        tag="Solicitud de reserva"
        title={roomType.nombre}
        description={roomType.descripcion || ''}
        image={image}
        imageAlt={roomType.nombre}
      />

      <section className="py-12">
        <div className="container max-w-3xl space-y-8">
          <Link
            href={`/hospedaje?checkIn=${checkIn}&checkOut=${checkOut}&adultos=${adultos}&ninos=${ninos}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a resultados
          </Link>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Detalles de la habitación</h2>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Capacidad: hasta {roomType.capacidad_max} personas
              </div>
              {roomType.cama && (
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {roomType.cama}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Precio estimado</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-cafe">
                    ${total.toLocaleString('es-CO')}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">COP</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ${roomType.precio_noche_muestra.toLocaleString('es-CO')} × {nights} noche
                {nights > 1 ? 's' : ''}
              </p>
              {roomType.is_sample && (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  * Precio de ejemplo — confirmamos tarifa real al procesar tu solicitud.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Completa tu solicitud</h2>
            <ReservationForm
              roomTypeSlug={slug}
              checkIn={checkIn}
              checkOut={checkOut}
              adultos={adultos}
              ninos={ninos}
            />
          </div>
        </div>
      </section>
    </>
  )
}
