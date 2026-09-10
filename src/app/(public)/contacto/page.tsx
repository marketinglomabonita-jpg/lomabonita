import type { Metadata } from 'next'
import { Facebook, Instagram, MapPin, Phone } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { formatPhone, waLink } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import { buttonVariants } from '@/core/ui/button'
import { PageHero } from '@/features/marketing/components/page-hero'
import { TikTokIcon, WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import { ContactForm } from '@/features/contacto/components/contact-form'

export const metadata: Metadata = {
  title: 'Contacto y reservas',
  description:
    'Reservas y contacto de Finca Hotel Loma Bonita: WhatsApp 310 291 3182, línea 324 497 1602, horarios, dirección en Piedras de Moler (Vía Alcalá, Cartago) y cómo llegar.',
}

const HORARIOS = [
  { label: 'Reservas', value: BUSINESS.hours.reservas },
  { label: 'Pasadías', value: BUSINESS.hours.pasadia },
  { label: 'Hospedaje', value: BUSINESS.hours.hospedaje },
]

const SOCIALS = [
  {
    href: BUSINESS.social.instagram,
    label: 'Instagram',
    handle: BUSINESS.links.instagramHandle,
    icon: Instagram,
  },
  { href: BUSINESS.social.facebook, label: 'Facebook', handle: 'Loma Bonita', icon: Facebook },
  { href: BUSINESS.social.tiktok, label: 'TikTok', handle: '@fincalomabonita', icon: null },
]

export default function ContactoPage() {
  return (
    <>
      <PageHero
        tag="Reservas & contacto"
        title="¡Planea tu día perfecto hoy mismo!"
        description="Completa el formulario para cotizar o contáctanos de inmediato por nuestras líneas oficiales."
        image={IMAGES['zona-de-desanso']}
        imageAlt="Zonas de descanso de la Finca Loma Bonita"
      />

      <section className="py-12 sm:py-16">
        <div className="container grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-6">
            <div className="space-y-4">
              <a
                href={waLink('¡Hola Finca Loma Bonita! Quiero más información.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#1da851]">
                  <WhatsAppIcon className="size-6" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                    Reserva directa por WhatsApp
                  </span>
                  <span className="block text-lg font-semibold text-primary">
                    {formatPhone(BUSINESS.phones[0])}
                  </span>
                </span>
              </a>
              <a
                href={`tel:${BUSINESS.phones[1]}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <Phone className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                    Línea telefónica de atención
                  </span>
                  <span className="block text-lg font-semibold text-primary">
                    {formatPhone(BUSINESS.phones[1])}
                  </span>
                </span>
              </a>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold text-cafe">Horarios</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {HORARIOS.map((h) => (
                  <li key={h.label} className="flex items-start justify-between gap-4">
                    <span className="font-medium text-foreground">{h.label}</span>
                    <span className="text-right">{h.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold text-cafe">Ubicación</h2>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {BUSINESS.displayAddress}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Muy cerca al histórico puente de Piedras de Moler, el acceso principal al
                Río La Vieja. Vía totalmente pavimentada; parqueadero privado, gratuito
                y vigilado.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={BUSINESS.links.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                >
                  <MapPin aria-hidden="true" />
                  Abrir en Google Maps
                </a>
                <a
                  href={BUSINESS.links.waze}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Navegar con Waze
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold text-cafe">Síguenos</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    {social.icon ? (
                      <social.icon className="size-4 text-primary" aria-hidden="true" />
                    ) : (
                      <TikTokIcon className="size-4 text-primary" />
                    )}
                    {social.handle}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-cafe">
              Cotiza tu plan
            </h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
              Completa tus datos y te enviamos la solicitud directa a WhatsApp.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
