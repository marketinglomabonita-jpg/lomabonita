import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { CalendarCheck, Check, Clock, ParkingCircle, ShieldCheck, Sun, Ticket } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { IMAGES, type ImageAsset } from '@/core/lib/images'
import { breadcrumbJsonLd, buildPageMetadata, JsonLd } from '@/core/lib/seo'
import { buttonVariants } from '@/core/ui/button'
import { waLink } from '@/core/lib/contact'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'

export const metadata: Metadata = buildPageMetadata({
  title: 'Pasadía en Cartago — Piscina, almuerzo típico y diversión en el Eje Cafetero',
  description:
    'Plan de pasadía en Cartago con piscina tropical, zonas verdes, cancha de fútbol, billares, zona infantil y restaurante campestre en Piedras de Moler. Suma karts, cabalgata o balsaje por el Río La Vieja. Ingreso desde las 9:00 a.m.',
  path: '/pasadias',
  image: IMAGES['piscina-recreativa'],
  imageAlt: 'Piscina recreativa de la Finca Loma Bonita',
})

const INCLUYE = [
  'Piscina tropical con zonas seguras para niños',
  'Zonas verdes y espacios de descanso (hamacas, jardines)',
  'Cancha de fútbol en césped natural',
  'Salón de juegos con billares y juego de rana',
  'Zona infantil con columpios',
  'Acceso al restaurante campestre',
]

const CONDICIONES = [
  { icon: Sun, title: 'Horario de pasadía', text: `Ingreso desde las 9:00 a.m. hasta las 5:30 p.m. (${BUSINESS.hours.pasadia.toLowerCase()}).` },
  { icon: Clock, title: 'Reserva previa', text: `Controlamos el aforo para garantizar tranquilidad. Reservas ${BUSINESS.hours.reservas.toLowerCase()}.` },
  { icon: ParkingCircle, title: 'Parqueadero gratuito', text: 'Parqueadero privado dentro de la finca, seguro y vigilado para todos nuestros clientes.' },
  { icon: ShieldCheck, title: 'Apto para todos', text: 'Ambiente familiar: grandes y chicos encuentran recreación, deporte y descanso.' },
]

const ZONAS: { image: ImageAsset; alt: string; caption: string }[] = [
  { image: IMAGES['piscina-recreativa'], alt: 'Piscina recreativa con aguas cristalinas', caption: 'Piscina recreativa' },
  { image: IMAGES['cancha-de-futbol'], alt: 'Cancha de fútbol en césped natural', caption: 'Cancha de fútbol' },
  { image: IMAGES['sala-de-juegos-billar-rana'], alt: 'Salón de juegos con billar y rana', caption: 'Billares y juegos' },
  { image: IMAGES['zona-infantil'], alt: 'Zona infantil con juegos para niños', caption: 'Zona infantil' },
  { image: IMAGES['zona-de-amacas-descanso'], alt: 'Zona de hamacas para descansar', caption: 'Zona de hamacas' },
  { image: IMAGES['zona-de-desanso'], alt: 'Zonas de descanso rodeadas de jardines', caption: 'Zonas de descanso' },
]

export default function PasadiasPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Pasadías', path: '/pasadias' },
        ])}
      />
      <PageHero
        tag="Plan pasadía"
        title="Un día completo de naturaleza y diversión"
        description="Acceso a todas las áreas comunes de la finca: piscina tropical, zonas verdes, cancha de fútbol, salón de juegos y restaurante campestre."
        image={IMAGES['piscina-recreativa']}
        imageAlt="Piscina recreativa de la Finca Loma Bonita"
      />

      <section className="py-16">
        <div className="container grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <SectionHeading
              align="left"
              tag="Qué incluye"
              title="Todo lo que puedes disfrutar"
            />
            <p className="text-muted-foreground">
              El plan pasadía te da acceso completo a nuestras áreas comunes durante todo
              el día. Trae a tu familia o a tus amigos y arma tu propio plan: deporte en
              la mañana, piscina al mediodía y un almuerzo típico en el restaurante.
            </p>
            <ul className="grid gap-2.5 pt-1 sm:grid-cols-2">
              {INCLUYE.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-3">
              <a
                href={waLink('¡Hola! Quiero cotizar una pasadía en Loma Bonita.')}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'accent' })}
              >
                <WhatsAppIcon className="size-4" />
                Cotizar pasadía
              </a>
              <Link href="/contacto" className={buttonVariants({ variant: 'outline' })}>
                <CalendarCheck aria-hidden="true" />
                Formulario de reserva
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ZONAS.map((zona) => (
              <figure key={zona.image.src} className="overflow-hidden rounded-xl shadow-sm">
                <Image
                  src={zona.image.src}
                  alt={zona.alt}
                  width={zona.image.w}
                  height={zona.image.h}
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="h-40 w-full object-cover"
                />
                <figcaption className="bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  {zona.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading
            tag="Antes de venir"
            title="Condiciones y horarios"
          />
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
            {CONDICIONES.map((c) => (
              <div key={c.title} className="flex gap-3 rounded-xl border border-border bg-card p-5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <c.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display font-semibold text-cafe">{c.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
            <Ticket className="size-4 shrink-0" aria-hidden="true" />
            La compra de tickets en línea llega muy pronto. Por ahora reservamos por
            WhatsApp o formulario.
          </p>
        </div>
      </section>
    </>
  )
}
