import Link from 'next/link'
import Image from 'next/image'
import { differenceInDays } from 'date-fns'
import { Check } from 'lucide-react'
import { searchAvailability } from '../api/availability'
import { searchParamsSchema } from '../contracts/types'
import { buttonVariants } from '@/core/ui/button'
import { IMAGES } from '@/core/lib/images'

type Props = {
  searchParams: {
    checkIn?: string
    checkOut?: string
    adultos?: string
    ninos?: string
  }
}

const ROOM_IMAGES: Record<string, { src: string; w: number; h: number }> = {
  'clasica-doble': IMAGES['habitaciones-3-vertical'],
  'confort-familiar': IMAGES['habitaciones-1-vertical'],
  'cabana-multiple': IMAGES['habitaciones-2-vertical'],
}

export async function AvailabilityResults({ searchParams }: Props) {
  // Validar parámetros
  const parsed = searchParamsSchema.safeParse(searchParams)

  if (!parsed.success) {
    return null
  }

  const { checkIn, checkOut, adultos, ninos } = parsed.data

  // Buscar disponibilidad
  const { roomTypes, error } = await searchAvailability({ checkIn, checkOut, adultos, ninos })

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (roomTypes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
        <p className="text-muted-foreground">
          No hay habitaciones disponibles para esas fechas y ese número de personas.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Intenta con otras fechas o contáctanos por WhatsApp.
        </p>
      </div>
    )
  }

  const nights = differenceInDays(new Date(checkOut), new Date(checkIn))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Encontramos <strong>{roomTypes.length}</strong> tipo(s) de habitación disponibles para{' '}
        <strong>{nights}</strong> noche{nights > 1 ? 's' : ''}, {adultos} adulto{adultos > 1 ? 's' : ''}
        {ninos > 0 && ` y ${ninos} niño${ninos > 1 ? 's' : ''}`}.
      </p>

      <div className="grid gap-6">
        {roomTypes.map((rt) => {
          const image = ROOM_IMAGES[rt.slug] || IMAGES['habitaciones-1-vertical']
          const total = rt.precio_noche_muestra * nights

          return (
            <article
              key={rt.id}
              className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:grid-cols-2"
            >
              <div className="relative min-h-64">
                <Image
                  src={image.src}
                  alt={rt.nombre}
                  width={image.w}
                  height={image.h}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                  Disponible
                </span>
              </div>

              <div className="flex flex-col gap-4 p-6 sm:p-8">
                <h3 className="font-display text-2xl font-semibold text-cafe">{rt.nombre}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{rt.descripcion}</p>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    Capacidad: hasta {rt.capacidad_max} personas
                  </div>
                  {rt.cama && (
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {rt.cama}
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-3 border-t border-border pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Precio estimado</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-cafe">
                        ${total.toLocaleString('es-CO')}
                      </span>
                      <span className="ml-1 text-sm text-muted-foreground">COP</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${rt.precio_noche_muestra.toLocaleString('es-CO')} × {nights} noche
                    {nights > 1 ? 's' : ''}
                  </p>

                  <Link
                    href={`/hospedaje/${rt.slug}?${new URLSearchParams({ checkIn, checkOut, adultos: String(adultos), ninos: String(ninos) }).toString()}`}
                    className={buttonVariants({ className: 'w-full' })}
                  >
                    Solicitar reserva
                  </Link>
                </div>

                {rt.is_sample && (
                  <p className="text-xs italic text-muted-foreground">
                    * Precio de ejemplo — confirmamos tarifa real al procesar tu solicitud.
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
