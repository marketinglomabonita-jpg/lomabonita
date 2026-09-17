import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ChefHat, Utensils } from 'lucide-react'
import { IMAGES } from '@/core/lib/images'
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  JsonLd,
  restaurantJsonLd,
} from '@/core/lib/seo'
import { buttonVariants } from '@/core/ui/button'
import { waLink } from '@/core/lib/contact'
import { Faq, type FaqItem } from '@/features/marketing/components/faq'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WhatsAppBooking } from '@/features/marketing/components/whatsapp-booking'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import { formatCop } from '@/core/lib/money'
import { DISHES, HOUSE_DISH } from '@/features/restaurante/data/menu'

const DISH_PRICE = formatCop(DISHES[0].price)

const PAGE_DESCRIPTION = `Restaurante campestre en Cartago, vía Alcalá: mojarra frita, sancocho, chicharrón, fiambre y cocina típica desde ${DISH_PRICE}. Plato de la casa estilo bandeja paisa por ${formatCop(HOUSE_DISH.price)}, con vista a la piscina.`

export const metadata: Metadata = buildPageMetadata({
  title: 'Restaurante campestre en Cartago — Comida típica del Eje Cafetero',
  description: PAGE_DESCRIPTION,
  path: '/restaurante',
  image: IMAGES['almuerzo-tipico-vertical'],
  imageAlt: 'Almuerzo típico del restaurante campestre de Finca Hotel Loma Bonita',
})

const FOTOS = [
  { image: IMAGES['almuerzo-pezcado-vertical'], alt: 'Almuerzo de pescado en el restaurante campestre', caption: 'Pescado del día' },
  { image: IMAGES['fiambre-tradicional-restaurante'], alt: 'Fiambre tradicional envuelto en hoja de plátano', caption: 'Fiambre tradicional' },
  { image: IMAGES['restaurante-vista-a-la-piscina-vertical'], alt: 'Mesas del restaurante con vista a la piscina', caption: 'Vista a la piscina' },
  { image: IMAGES['vistantes-restaurante-vertical'], alt: 'Visitantes almorzando en el restaurante campestre', caption: 'Almuerzo en familia' },
]

const FAQS: FaqItem[] = [
  {
    question: '¿Cuánto cuesta almorzar en el restaurante de Loma Bonita?',
    answer: `Todos los platos de la carta cuestan ${DISH_PRICE} y el Plato de la Casa, nuestra versión de la bandeja paisa, cuesta ${formatCop(HOUSE_DISH.price)}.`,
  },
  {
    question: '¿Qué platos tienen?',
    answer: `Mojarra frita, pescado guisado, cerdo a la plancha, pollo a la plancha, sancocho bifásico, fiambre, chicharrón y el Plato de la Casa.`,
  },
  {
    question: '¿El almuerzo está incluido en la pasadía?',
    answer:
      'Sí. Todas nuestras pasadías (Loma Relax, Racing, Cascadas y Aventura de Río) incluyen almuerzo: eliges entre las opciones disponibles ese día.',
  },
  {
    question: '¿Puedo reservar mesa para un grupo o una celebración?',
    answer:
      'Sí. Escríbenos por WhatsApp con la fecha y el número de personas y te confirmamos disponibilidad. Las reservas están sujetas a disponibilidad.',
  },
]

export default function RestaurantePage() {
  return (
    <>
      <JsonLd
        data={restaurantJsonLd({
          image: IMAGES['almuerzo-tipico-vertical'],
          description: PAGE_DESCRIPTION,
          menu: [HOUSE_DISH, ...DISHES],
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Restaurante', path: '/restaurante' },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <PageHero
        tag="Restaurante campestre en Cartago"
        title="Sazón de pueblo, con vista a la piscina"
        description={`Cocina típica colombiana en plena vía Cartago–Alcalá: pescado, sancocho, chicharrón y fiambre desde ${DISH_PRICE}. Almuerza al aire libre, rodeado de montaña.`}
        image={IMAGES['almuerzo-tipico-vertical']}
        imageAlt="Almuerzo típico del restaurante campestre"
      />

      <section className="py-16" id="carta">
        <div className="container max-w-5xl space-y-10">
          <SectionHeading
            tag="Nuestra carta"
            title="Platos típicos, precios de casa"
            subtitle={`Todos los platos a ${DISH_PRICE}. El Plato de la Casa, a ${formatCop(HOUSE_DISH.price)}.`}
          />

          <article className="overflow-hidden rounded-2xl border-2 border-accent/40 bg-accent/5 sm:grid sm:grid-cols-5">
            <Image
              src={IMAGES['almuerzo-tipico-vertical'].src}
              alt="Almuerzo típico del restaurante Loma Bonita"
              width={IMAGES['almuerzo-tipico-vertical'].w}
              height={IMAGES['almuerzo-tipico-vertical'].h}
              sizes="(min-width: 640px) 40vw, 100vw"
              className="h-56 w-full object-cover sm:col-span-2 sm:h-full"
            />
            <div className="flex flex-col justify-center gap-3 p-6 sm:col-span-3 sm:p-8">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                <ChefHat className="size-4" aria-hidden="true" />
                Especialidad
              </p>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-3xl font-semibold text-cafe">{HOUSE_DISH.name}</h3>
                <span className="text-3xl font-bold text-cafe">{formatCop(HOUSE_DISH.price)}</span>
              </div>
              <p className="text-muted-foreground">{HOUSE_DISH.description}</p>
            </div>
          </article>

          <ul className="grid gap-4 sm:grid-cols-2">
            {DISHES.map((dish) => (
              <li key={dish.name} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold text-cafe">{dish.name}</h3>
                  <span
                    className="mb-1 flex-1 border-b border-dotted border-border"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-primary">{formatCop(dish.price)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{dish.description}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={waLink('¡Hola! Quiero reservar mesa en el restaurante de Finca Hotel Loma Bonita. Fecha: ___ · Personas: ___')}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'accent' })}
            >
              <WhatsAppIcon className="size-4" />
              Reservar mesa
            </a>
            <Link href="/pasadias" className={buttonVariants({ variant: 'outline' })}>
              <Utensils aria-hidden="true" />
              Pasadía con almuerzo incluido
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <SectionHeading
              align="left"
              tag="Cocina típica del Eje Cafetero"
              title="Lo que se come en un buen paseo de finca"
            />
            <p className="text-muted-foreground">
              En Loma Bonita cocinamos lo que el paseo pide: una mojarra frita dorada, un
              sancocho con dos carnes, el chicharrón crocante de la tradición paisa y el
              fiambre de toda la vida, envuelto en hoja de plátano.
            </p>
            <p className="text-muted-foreground">
              Si estás en Cartago y buscas dónde almorzar en el campo, o vienes de recorrer
              Alcalá, Quimbaya o el Río La Vieja, nuestro restaurante te recibe con precios
              justos, porciones generosas y mesas al aire libre con vista a la piscina.
            </p>
            <p className="text-sm">
              ¿Vienes a pasar el día?{' '}
              <Link href="/pasadias" className="font-medium text-primary hover:underline">
                Todas nuestras pasadías
              </Link>{' '}
              incluyen almuerzo. ¿Te quedas la noche?{' '}
              <Link href="/hospedaje" className="font-medium text-primary hover:underline">
                Mira el hospedaje
              </Link>
              .
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FOTOS.map((foto) => (
              <figure key={foto.caption} className="overflow-hidden rounded-xl shadow-sm">
                <Image
                  src={foto.image.src}
                  alt={foto.alt}
                  width={foto.image.w}
                  height={foto.image.h}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="h-44 w-full object-cover lg:h-52"
                />
                <figcaption className="bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  {foto.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container space-y-12">
          <WhatsAppBooking
            title="¿Vienes en grupo o a celebrar?"
            steps={[
              'Escríbenos por WhatsApp con la fecha, la hora y el número de personas.',
              'Te confirmamos disponibilidad de mesa y los platos del día.',
              'Llegas, te sientas y nosotros nos encargamos del resto.',
            ]}
            message="¡Hola! Quiero reservar en el restaurante de Finca Hotel Loma Bonita. Fecha: ___ · Personas: ___"
            cta="Reservar por WhatsApp"
          />
          <div className="space-y-6">
            <SectionHeading tag="Preguntas frecuentes" title="Sobre nuestro restaurante" />
            <Faq items={FAQS} />
          </div>
        </div>
      </section>
    </>
  )
}
