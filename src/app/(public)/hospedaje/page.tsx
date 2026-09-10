import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { CalendarClock, Check, Clock, LogIn, LogOut } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { IMAGES } from '@/core/lib/images'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'
import { waLink } from '@/core/lib/contact'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import { ROOMS } from '@/features/hospedaje/data/rooms'

export const metadata: Metadata = {
  title: 'Hospedaje campestre',
  description:
    'Habitaciones equipadas y tranquilas en Piedras de Moler (Cartago): Confort Familiar, Cabaña Múltiple, Clásica Doble y Suite Loma Bonita. Check-in 3:00 p.m., check-out 1:00 p.m.',
}

const HORARIOS = [
  { icon: LogIn, label: 'Check-in', value: '3:00 p.m.' },
  { icon: LogOut, label: 'Check-out', value: '1:00 p.m.' },
  { icon: Clock, label: 'Reservas', value: BUSINESS.hours.reservas },
]

export default function HospedajePage() {
  return (
    <>
      <PageHero
        tag="Cómodo hospedaje"
        title="Tu descanso soñado en plena loma"
        description="Habitaciones completamente equipadas, cómodas y rodeadas de total tranquilidad acústica y visual para reconectar tus energías."
        image={IMAGES['habitaciones-2-vertical']}
        imageAlt="Habitación familiar con múltiples acomodaciones"
      />

      <section className="border-b border-border bg-muted/40">
        <div className="container grid gap-4 py-8 sm:grid-cols-3">
          {HORARIOS.map((h) => (
            <div
              key={h.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <h.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{h.label}</p>
                <p className="text-sm font-medium">{h.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container space-y-10">
          <SectionHeading
            tag="Acomodaciones"
            title="Cuatro formas de quedarse en Loma Bonita"
            subtitle="Desde una escapada de pareja hasta la integración de todo un equipo."
          />
          {ROOMS.map((room) => (
            <article
              key={room.slug}
              className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:grid-cols-2"
            >
              <div className="relative min-h-64">
                <Image
                  src={room.image.src}
                  alt={room.imageAlt}
                  width={room.image.w}
                  height={room.image.h}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                  {room.badge}
                </span>
              </div>
              <div className="flex flex-col gap-4 p-6 sm:p-8">
                <h2 className="font-display text-2xl font-semibold text-cafe">{room.name}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{room.description}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {room.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {amenity}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                  <a
                    href={waLink(room.ctaMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'accent' })}
                  >
                    <WhatsAppIcon className="size-4" />
                    Cotizar por WhatsApp
                  </a>
                  <Link href="/contacto" className={buttonVariants({ variant: 'outline' })}>
                    <CalendarClock aria-hidden="true" />
                    Formulario de reserva
                  </Link>
                </div>
              </div>
            </article>
          ))}

          <p
            className={cn(
              'mx-auto max-w-2xl rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground',
            )}
          >
            La reserva en línea con disponibilidad en tiempo real llega muy pronto. Por
            ahora cotizamos por WhatsApp o con el formulario de contacto.
          </p>
        </div>
      </section>
    </>
  )
}
