import Link from 'next/link'
import type { Metadata } from 'next'
import { Car, Check, Droplets, MapPin, Sparkles, Waves } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'
import { waLink } from '@/core/lib/contact'
import { IMAGES } from '@/core/lib/images'
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  JsonLd,
  touristAttractionJsonLd,
} from '@/core/lib/seo'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import { EXPERIENCES, type Experience } from '@/features/experiencias/data/experiences'

export const metadata: Metadata = buildPageMetadata({
  title: 'Balsaje por el Río La Vieja, karts y cascadas — Planes en el Eje Cafetero',
  description:
    'Balsaje por el Río La Vieja con transporte en jeep desde Loma Bonita (Cartago, vía Alcalá), pista de karts y visita a cascadas. Planes con pasadía incluida, cerca del Parque del Café y PANACA.',
  path: '/experiencias',
  image: IMAGES['loma-bonita'],
  imageAlt: 'Panorámica de la Finca Loma Bonita, a pasos del Río La Vieja',
})

const EXPERIENCE_ICONS = {
  karts: Car,
  cascadas: Droplets,
  balsaje: Waves,
} as const satisfies Record<Experience['id'], typeof Car>

function ExperienceCard({ experience }: { experience: Experience }) {
  const Icon = EXPERIENCE_ICONS[experience.id]
  return (
    <article
      className={cn(
        'grid gap-6 rounded-xl border bg-card p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:gap-8',
        experience.featured
          ? 'border-accent/60 shadow-lg ring-1 ring-accent/30'
          : 'border-border shadow-sm',
      )}
    >
      <span
        className={cn(
          'inline-flex size-14 items-center justify-center rounded-full',
          experience.featured ? 'bg-accent text-white' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-semibold text-cafe">{experience.title}</h2>
          {experience.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Experiencia insignia
            </span>
          )}
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {experience.tagline}
        </p>
        <p className="leading-relaxed text-foreground/85">{experience.description}</p>
        <ul className="grid gap-2 pt-1 sm:grid-cols-2">
          {experience.details.map((detail) => (
            <li key={detail} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {detail}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:w-52 lg:pt-1">
        <a
          href={waLink(experience.ctaMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: experience.featured ? 'accent' : 'primary' }),
            'w-full',
          )}
        >
          <WhatsAppIcon className="size-4" />
          Reservar experiencia
        </a>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Sujeto a disponibilidad y clima.
        </p>
      </div>
    </article>
  )
}

export default function ExperienciasPage() {
  const balsaje = EXPERIENCES.find((e) => e.id === 'balsaje')

  return (
    <>
      {balsaje && (
        <JsonLd
          data={touristAttractionJsonLd({
            name: balsaje.title,
            description: balsaje.description,
            image: IMAGES['loma-bonita'],
            touristType: ['Familias', 'Grupos de amigos', 'Turismo de aventura'],
          })}
        />
      )}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Experiencias', path: '/experiencias' },
        ])}
      />
      <PageHero
        tag="Aventura y tradición"
        title="Experiencias en el Eje Cafetero"
        description="Suma aventura a tu pasadía o hospedaje: velocidad en los karts, naturaleza en las cascadas y el tradicional balsaje por el Río La Vieja."
        image={IMAGES['entrada-finca-loma-bonita']}
        imageAlt="Entrada campestre de la Finca Loma Bonita, a pasos del Río La Vieja"
      />

      <section className="py-16">
        <div className="container space-y-8">
          <SectionHeading
            tag="Nuestras experiencias"
            title="Tres maneras de vivir la región"
            subtitle="Cada una incluye todo lo de la pasadía Loma Relax. Reservas por WhatsApp, sujetas a disponibilidad."
          />
          {EXPERIENCES.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl space-y-6">
            <SectionHeading
              tag="Por qué desde la finca"
              title="La ventaja de estar en Piedras de Moler"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-semibold text-cafe">Otros operadores</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Para hacer balsaje por tu cuenta tienes que llegar hasta Quimbaya,
                  buscar operador, organizar el transporte y resolver dónde almorzar y
                  dónde descansar después.
                </p>
              </div>
              <div className="rounded-xl border border-accent/50 bg-accent/5 p-6">
                <h3 className="font-display font-semibold text-accent">Con Loma Bonita</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  Sales de la finca en jeep o Willys, pasas por Alcalá y Quimbaya hasta
                  Puerto Alejandría, navegas el río con fiambre típico y además
                  disfrutas todo lo de Loma Relax: piscina, almuerzo, juegos y zonas de
                  descanso a 2 minutos del Río La Vieja.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <a
                href={waLink(
                  '¡Hola! Quiero reservar Loma Aventura de Río (balsaje por el Río La Vieja) en Finca Hotel Loma Bonita.',
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'accent', size: 'lg' })}
              >
                <WhatsAppIcon className="size-4" />
                Reservar balsaje
              </a>
              <Link href="/pasadias" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <MapPin aria-hidden="true" />
                Ver pasadías Loma
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
