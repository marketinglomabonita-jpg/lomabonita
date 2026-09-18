import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { MapPin, Ticket } from 'lucide-react'
import { IMAGES } from '@/core/lib/images'
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  JsonLd,
} from '@/core/lib/seo'
import { cn } from '@/core/lib/utils'
import { waLink } from '@/core/lib/contact'
import { buttonVariants } from '@/core/ui/button'
import { Faq, type FaqItem } from '@/features/marketing/components/faq'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import { PARKS, DESTINOS_FAQS, type Park } from '@/features/destinos/data/parks'

const PATH = '/pasaportes-parques-eje-cafetero'

export const metadata: Metadata = buildPageMetadata({
  title: 'Pasaportes y Entradas Parques del Eje Cafetero',
  description:
    'Compra tus pasaportes para Parque del Café, PANACA, Ukumarí, Termales Santa Rosa y Los Arrieros desde Loma Bonita. Hospedaje y turismo cerca de los principales parques del Eje Cafetero.',
  path: PATH,
  image: IMAGES['primera-seccion-finca-loma-bonita'],
  imageAlt: 'Finca Hotel Loma Bonita, punto de partida para recorrer los parques del Eje Cafetero',
})

// CTAs generales por WhatsApp (mensajes propios de la página).
const WA_CONSULTAR_DISPONIBLES =
  '¡Hola! Quiero consultar los pasaportes disponibles para los parques del Eje Cafetero desde Loma Bonita.'
const WA_CONSULTAR_RECORRIDO =
  '¡Hola! Estoy planeando un recorrido por el Eje Cafetero y quiero consultar pasaportes disponibles, fechas y precios desde Loma Bonita.'

// Chips de destinos del copy del dueño.
const PARQUES_CHIPS = ['Parque del Café', 'PANACA', 'Ukumarí', 'Termales Santa Rosa de Cabal', 'Parque Los Arrieros']
const DESTINOS_CHIPS = ['Alcalá', 'Quimbaya', 'Filandia', 'Salento', 'Pereira', 'Armenia', 'Cartago']

const FAQS: FaqItem[] = DESTINOS_FAQS.map((f) => ({ question: f.question, answer: f.answer }))

export default function DestinosPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Destinos', path: PATH },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <PageHero
        tag="Pasaportes · Eje Cafetero"
        title="Pasaportes para los principales parques del Eje Cafetero"
        description="Planea tus días de turismo desde Loma Bonita."
        image={IMAGES['primera-seccion-finca-loma-bonita']}
        imageAlt="Finca Hotel Loma Bonita, en Piedras de Moler, vía Alcalá–Cartago"
      />

      {/* Intro del dueño */}
      <section className="py-14 sm:py-16">
        <div className="container max-w-3xl space-y-4">
          <p className="text-muted-foreground">
            El Eje Cafetero está lleno de lugares para descubrir: parques temáticos, naturaleza,
            cultura, aventura y experiencias para disfrutar en familia.
          </p>
          <p className="text-muted-foreground">
            En Finca Hotel Loma Bonita, ubicada en Piedras de Moler, vía Alcalá–Cartago, puedes
            organizar tu visita y adquirir directamente los pasaportes disponibles para algunos de
            los principales atractivos turísticos de la región.
          </p>
          <p className="text-muted-foreground">
            Así puedes hacer de Loma Bonita tu punto de alojamiento, descanso y partida para conocer
            el Eje Cafetero.
          </p>
          <div className="pt-2">
            <a
              href={waLink(WA_CONSULTAR_DISPONIBLES)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'accent', size: 'lg' })}
            >
              <WhatsAppIcon className="size-4" />
              Consultar pasaportes disponibles
            </a>
          </div>
        </div>
      </section>

      {/* Descubre el Eje Cafetero desde Loma Bonita */}
      <section className="bg-muted/40 py-14 sm:py-16">
        <div className="container max-w-3xl space-y-5">
          <SectionHeading
            align="left"
            tag="Tu punto de partida"
            title="Descubre el Eje Cafetero desde Loma Bonita"
          />
          <p className="text-muted-foreground">
            Nuestra ubicación permite conectar fácilmente con diferentes destinos turísticos de
            Quindío, Risaralda y Valle del Cauca.
          </p>
          <p className="text-muted-foreground">
            Puedes combinar tu estadía en Loma Bonita con visitas a parques temáticos, termales,
            pueblos tradicionales y diferentes atractivos naturales de la región.
          </p>
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-sm font-semibold text-cafe">Desde aquí puedes planear visitas a:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {PARQUES_CHIPS.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-sm text-cafe"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-cafe">Y también descubrir destinos como:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {DESTINOS_CHIPS.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compra tus pasaportes — 5 parques */}
      <section className="py-14 sm:py-16">
        <div className="container space-y-10">
          <SectionHeading
            tag="🎟️ Compra tus pasaportes"
            title="Los parques y atractivos del Eje Cafetero, en un solo lugar"
            subtitle="Consulta con nosotros la disponibilidad y adquiere el pasaporte de cada parque."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {PARKS.map((park) => (
              <ParkCard key={park.id} park={park} />
            ))}
          </div>
          <p className="mx-auto max-w-2xl text-center text-xs text-muted-foreground">
            Los logos pertenecen a cada parque y se muestran únicamente para identificarlos. Los
            parques son operados de forma independiente y no forman parte de Loma Bonita. Pasaportes
            sujetos a disponibilidad; precios y condiciones los define cada parque.
          </p>
        </div>
      </section>

      {/* Tu base para recorrer el Eje Cafetero (hospedaje + ubicación) */}
      <section className="bg-muted/40 py-14 sm:py-16">
        <div className="container max-w-3xl space-y-5">
          <SectionHeading
            align="left"
            tag="Hospédate y descubre más"
            title="Tu base para recorrer el Eje Cafetero"
          />
          <p className="text-muted-foreground">
            ¿Por qué elegir un solo destino? Puedes hospedarte en un entorno campestre y organizar
            diferentes días para conocer los atractivos turísticos de la región.
          </p>
          <p className="text-muted-foreground">
            Un día puedes visitar ☕ Parque del Café; otro día 🐄 PANACA; también puedes conocer
            🦁 Ukumarí, ♨️ Termales de Santa Rosa de Cabal y 🐴 Parque Los Arrieros. Y regresar a
            Loma Bonita para descansar, disfrutar de la piscina, comer en nuestro restaurante y
            prepararte para el siguiente recorrido.
          </p>
          <p className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Loma Bonita está ubicada en Piedras de Moler, vía Alcalá–Cartago, en un punto
              estratégico para conectar con diferentes destinos del Eje Cafetero, cerca del Río La
              Vieja y de los principales parques temáticos de la región.
            </span>
          </p>
          <div className="pt-2">
            <Link href="/hospedaje" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              Ver hospedaje
            </Link>
          </div>
        </div>
      </section>

      {/* Te ayudamos a organizar tu recorrido */}
      <section className="py-14 sm:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-cafe">
              ¿Quieres visitar varios lugares? Te ayudamos a organizar tu recorrido
            </h2>
            <p className="mt-3 text-muted-foreground">
              Si estás planeando unas vacaciones en el Eje Cafetero, no tienes que limitarte a un
              solo parque. Nuestro equipo puede ayudarte a conocer las opciones de pasaportes
              disponibles, fechas, precios y alternativas para organizar tu visita.
            </p>
            <div className="mt-6 flex justify-center">
              <a
                href={waLink(WA_CONSULTAR_RECORRIDO)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'accent', size: 'lg' })}
              >
                <WhatsAppIcon className="size-4" />
                Consultar pasaportes por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="bg-muted/40 py-14 sm:py-16">
        <div className="container space-y-6">
          <SectionHeading tag="Preguntas frecuentes" title="Pasaportes y visitas a los parques" />
          <Faq items={FAQS} />
        </div>
      </section>
    </>
  )
}

function ParkCard({ park }: { park: Park }) {
  return (
    <article
      id={park.id}
      className="flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-border bg-white p-5">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center">
          <Image
            src={park.logo.src}
            alt={park.logoAlt}
            width={park.logo.w}
            height={park.logo.h}
            sizes="112px"
            className="max-h-20 w-auto max-w-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold text-cafe">
            <span aria-hidden="true">{park.emoji}</span> {park.name}
          </h3>
          {park.tagline && <p className="text-sm text-muted-foreground">{park.tagline}</p>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        {park.paragraphs.map((p) => (
          <p key={p} className="text-sm text-muted-foreground">
            {p}
          </p>
        ))}
        <p className="mt-auto flex items-start gap-2 pt-1 text-xs text-muted-foreground/80">
          <Ticket className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{park.searchTerms}</span>
        </p>
        <a
          href={waLink(park.waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'primary' }), 'w-full')}
        >
          <WhatsAppIcon className="size-4" />
          Comprar pasaporte
        </a>
      </div>
    </article>
  )
}
