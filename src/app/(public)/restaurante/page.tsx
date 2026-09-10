import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Check, Utensils } from 'lucide-react'
import { IMAGES } from '@/core/lib/images'
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  JsonLd,
  restaurantJsonLd,
} from '@/core/lib/seo'
import { buttonVariants } from '@/core/ui/button'
import { waLink } from '@/core/lib/contact'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'

const PAGE_DESCRIPTION =
  'Restaurante campestre en la Finca Loma Bonita: fiambre tradicional, almuerzos campesinos, desayunos con vista y la mejor sazón típica del Eje Cafetero, a pasos del Río La Vieja (Piedras de Moler, Cartago).'

export const metadata: Metadata = buildPageMetadata({
  title: 'Restaurante campestre en el Eje Cafetero — Comida típica en Cartago',
  description: PAGE_DESCRIPTION,
  path: '/restaurante',
  image: IMAGES['fiambre-tradicional-restaurante'],
  imageAlt: 'Fiambre tradicional del restaurante campestre Loma Bonita',
})

const DESTACADOS = [
  'Platos típicos de la región, con la sazón de siempre',
  'Fiambre tradicional y almuerzos campesinos',
  'Desayunos campestres con vista al paisaje',
  'Pescado frito y especialidades locales',
  'Atención para pasadías, hospedajes y eventos',
]

const FOTOS = [
  { image: IMAGES['fiambre-tradicional-restaurante'], alt: 'Fiambre tradicional colombiano envuelto en hoja de plátano', caption: 'Fiambre tradicional' },
  { image: IMAGES['restaurante-vista-a-la-piscina-vertical'], alt: 'Mesa del restaurante con vista a la piscina', caption: 'Vista a la piscina' },
  { image: IMAGES['almuerzo-tipico-vertical'], alt: 'Almuerzo típico de la región', caption: 'Almuerzo típico' },
  { image: IMAGES['desayuno-vista-a-la-piscina-y-el-paisaje'], alt: 'Desayuno campestre con vistas a la piscina y el paisaje', caption: 'Desayuno con vista' },
]

export default function RestaurantePage() {
  return (
    <>
      <JsonLd
        data={restaurantJsonLd({
          image: IMAGES['fiambre-tradicional-restaurante'],
          description: PAGE_DESCRIPTION,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Restaurante', path: '/restaurante' },
        ])}
      />
      <PageHero
        tag="Gastronomía"
        title="Restaurante campestre"
        description="Disfruta de la mejor sazón típica de la región: platos tradicionales con ingredientes frescos de la zona para deleitar tu paladar mientras disfrutas del aire libre."
        image={IMAGES['fiambre-tradicional-restaurante']}
        imageAlt="Fiambre tradicional del restaurante campestre"
      />

      <section className="py-16">
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <SectionHeading
              align="left"
              tag="Nuestra cocina"
              title="Cocina tradicional del Eje Cafetero"
            />
            <p className="text-muted-foreground">
              Nuestro restaurante está abierto para quienes disfrutan una pasadía, se
              hospedan en la finca o celebran un evento. Preparamos recetas de la
              tradición paisa y valluna con ingredientes frescos de la zona, servidas en
              un ambiente fresco con vista a la piscina y a las montañas.
            </p>
            <ul className="space-y-2.5 pt-1">
              {DESTACADOS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-3">
              <a
                href={waLink('¡Hola! Quiero consultar el menú y horarios del restaurante de Loma Bonita.')}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'accent' })}
              >
                <WhatsAppIcon className="size-4" />
                Consultar por WhatsApp
              </a>
              <Link href="/contacto" className={buttonVariants({ variant: 'outline' })}>
                <Utensils aria-hidden="true" />
                Contacto
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FOTOS.map((foto) => (
              <figure key={foto.image.src} className="overflow-hidden rounded-xl shadow-sm">
                <Image
                  src={foto.image.src}
                  alt={foto.alt}
                  width={foto.image.w}
                  height={foto.image.h}
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="h-48 w-full object-cover sm:h-40 lg:h-48"
                />
                <figcaption className="bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  {foto.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <p className="mx-auto max-w-2xl rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            La carta digital y el pedido directo desde la mesa llegan muy pronto.
            Mientras tanto, consúltanos el menú del día por WhatsApp.
          </p>
        </div>
      </section>
    </>
  )
}
