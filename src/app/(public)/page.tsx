import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  ArrowRight,
  BedDouble,
  Car,
  Clock,
  Leaf,
  MapPin,
  Route,
  Smile,
  Sun,
  TreePine,
  Users,
  Waves,
} from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { IMAGES } from '@/core/lib/images'
import { buildPageMetadata, JsonLd, lodgingBusinessJsonLd } from '@/core/lib/seo'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'
import { Faq, type FaqItem } from '@/features/marketing/components/faq'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import { waLink } from '@/core/lib/contact'

const HOME_TITLE =
  'Finca Hotel Loma Bonita | Pasadía, hospedaje y experiencias en el Eje Cafetero'

const HOME_DESCRIPTION =
  'Finca hotel campestre en Piedras de Moler, Vía Alcalá (Cartago), a pasos del Río La Vieja. Pasadía con piscina, hospedaje campestre, restaurante típico, salón de eventos y balsaje por el Río La Vieja. A 40 minutos del Parque del Café y PANACA.'

export const metadata: Metadata = buildPageMetadata({
  title: HOME_TITLE,
  absoluteTitle: true,
  description: HOME_DESCRIPTION,
  path: '/',
  image: IMAGES['primera-seccion-finca-loma-bonita'],
  imageAlt: 'Piscina tropical de la Finca Hotel Loma Bonita en Piedras de Moler',
})

const FEATURES = [
  { icon: Waves, label: 'Piscina tropical' },
  { icon: TreePine, label: 'Área campestre' },
  { icon: MapPin, label: 'Piedras de Moler' },
  { icon: Sun, label: 'Pasadías inolvidables' },
]

const SERVICES = [
  {
    href: '/hospedaje',
    icon: BedDouble,
    image: IMAGES['habitaciones-1-vertical'],
    imageAlt: 'Habitación campestre y acogedora de Loma Bonita',
    title: 'Hospedaje campestre',
    description:
      'Habitaciones completamente equipadas y rodeadas de tranquilidad: cuatro acomodaciones para parejas, familias y grupos.',
  },
  {
    href: '/pasadias',
    icon: Sun,
    image: IMAGES['piscina-recreativa'],
    imageAlt: 'Piscina recreativa con aguas cristalinas',
    title: 'Pasadías',
    description:
      'Acceso completo a la piscina tropical, zonas verdes, cancha de fútbol, billares y restaurante. Ingreso desde las 9:00 a.m.',
  },
  {
    href: '/restaurante',
    icon: Waves,
    image: IMAGES['fiambre-tradicional-restaurante'],
    imageAlt: 'Fiambre tradicional del restaurante campestre',
    title: 'Restaurante campestre',
    description:
      'La mejor sazón típica de la región: platos tradicionales con ingredientes frescos de la zona, al aire libre.',
  },
  {
    href: '/experiencias',
    icon: Route,
    image: IMAGES['visitantes-pasadia'],
    imageAlt: 'Visitantes disfrutando una tarde de pasadía',
    title: 'Experiencias',
    description:
      'Pista de karts, cabalgata y balsaje por el Río La Vieja con salida y regreso desde la finca.',
  },
  {
    href: '/galeria',
    icon: TreePine,
    image: IMAGES['loma-bonita'],
    imageAlt: 'Panorámica de la Finca Loma Bonita y sus palmeras',
    title: 'Galería',
    description:
      'Explora los rincones, paisajes y momentos felices de nuestro pedacito de paraíso.',
  },
  {
    href: '/contacto',
    icon: Users,
    image: IMAGES['zonas-de-comunes-de-descanso'],
    imageAlt: 'Zonas comunes para eventos e integraciones',
    title: 'Salón de eventos',
    description:
      'Bodas, cumpleaños, aniversarios e integraciones corporativas. Nos adaptamos a tus necesidades.',
  },
]

const PILLARS = [
  {
    icon: Users,
    title: 'Familiar',
    description: 'Pensado para el disfrute y seguridad de grandes y chicos.',
  },
  {
    icon: Leaf,
    title: 'Natural',
    description: 'Aire puro, atardeceres mágicos y hermosos paisajes verdes.',
  },
  {
    icon: Smile,
    title: 'Divertido',
    description: 'Deporte, recreación acuática y juegos para todos.',
  },
]

const DISTANCIAS = [
  {
    icon: Car,
    title: 'Río La Vieja',
    description: 'A solo 2 minutos: zona inmediata de recreación y balsaje.',
  },
  {
    icon: Route,
    title: 'Vía Cartago – Alcalá',
    description: 'Acceso pavimentado y rápido para todo tipo de vehículos.',
  },
  {
    icon: MapPin,
    title: 'Atracciones del Eje Cafetero',
    description: 'Parque del Café y PANACA a menos de 45 minutos.',
  },
]

const TEASER = [
  { image: IMAGES['primera-seccion-finca-loma-bonita'], alt: 'Piscina tropical de la finca' },
  { image: IMAGES['piscina-nocturna'], alt: 'Piscina iluminada de noche' },
  { image: IMAGES['zonas-de-descanso-vista-a-la-piscina-y-la-montana'], alt: 'Zona de descanso con vista a la piscina y la montaña' },
  { image: IMAGES['almuerzo-tipico-vertical'], alt: 'Almuerzo típico de la región' },
  { image: IMAGES['visitantes-felices-finca-hotel-loma-bonita-vertical'], alt: 'Visitantes felices en la finca' },
  { image: IMAGES['billares-1'], alt: 'Mesa de billar del salón de juegos' },
]

const FAQS: FaqItem[] = [
  {
    question: '¿Qué incluye la pasadía en Finca Loma Bonita?',
    answer:
      'El plan pasadía te da acceso completo a nuestras áreas comunes: piscina tropical, zonas verdes, cancha de fútbol, salón de juegos con billares y acceso a nuestro restaurante campestre. El ingreso es desde las 9:00 a.m. hasta las 5:30 p.m.',
  },
  {
    question: '¿Cuál es la distancia a los principales parques del Eje Cafetero?',
    answer:
      'Estamos ubicados estratégicamente cerca del límite departamental. El Parque Nacional del Café y PANACA se encuentran a un rango aproximado de 40 a 45 minutos de recorrido a través de excelentes vías pavimentadas.',
  },
  {
    question: '¿Se requiere reserva previa para ingresar?',
    answer:
      'Sí: controlamos el aforo para asegurar la máxima tranquilidad, confort y hospitalidad de todos nuestros visitantes, así que es necesario realizar una reserva previa por WhatsApp para pasadías o hospedajes.',
  },
  {
    question: '¿Tienen parqueadero privado?',
    answer:
      'Sí, contamos con un amplio parqueadero privado dentro de las instalaciones de la finca, totalmente gratuito, seguro y vigilado para todos nuestros clientes de hospedaje y pasadía.',
  },
]

export default function HomePage() {
  const hero = IMAGES['primera-seccion-finca-loma-bonita']

  return (
    <>
      <JsonLd
        data={lodgingBusinessJsonLd({ image: hero, description: HOME_DESCRIPTION })}
      />
      <section className="relative flex min-h-[86svh] items-center overflow-hidden">
        <Image
          src={hero.src}
          alt="Primera sección de la Finca Loma Bonita con su piscina tropical"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-selva/85 via-selva/65 to-piscina/50"
          aria-hidden="true"
        />
        <div className="container relative py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/85 sm:text-sm">
            Bienvenidos al paraíso tropical
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
            {BUSINESS.legalName}
          </h1>
          <p className="mt-3 font-display text-xl text-white/95 sm:text-2xl">
            Pasadía &amp; Hospedaje
          </p>
          <p className="mt-4 max-w-xl text-white/85">
            Disfruta momentos inolvidables rodeado de naturaleza, diversión y
            tranquilidad. El lugar ideal para familias, amigos y empresas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className={cn(buttonVariants({ variant: 'accent', size: 'lg' }))}
            >
              Reservar ahora
            </Link>
            <Link
              href="#servicios"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-white/50 bg-transparent text-white hover:bg-white/10',
              )}
            >
              Explorar servicios
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container grid grid-cols-2 gap-4 py-6 sm:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.label} className="flex items-center gap-2.5 text-sm font-medium">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                <feature.icon className="size-4" aria-hidden="true" />
              </span>
              {feature.label}
            </div>
          ))}
        </div>
      </section>

      <section id="servicios" className="py-16 sm:py-20">
        <div className="container">
          <SectionHeading
            tag="Servicios disponibles"
            title="¿Qué te espera en Loma Bonita?"
            subtitle="Contamos con una infraestructura lista para ofrecerte la mejor experiencia en entretenimiento, gastronomía y descanso campestre."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Link
                key={service.href + service.title}
                href={service.href}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={service.image.src}
                    alt={service.imageAlt}
                    width={service.image.w}
                    height={service.image.h}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute bottom-3 left-3 inline-flex size-10 items-center justify-center rounded-full bg-white/95 text-primary shadow">
                    <service.icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="space-y-2 p-5">
                  <h3 className="font-display text-lg font-semibold text-cafe">
                    {service.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Saber más
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="experiencia" className="bg-muted/40 py-16 sm:py-20">
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-xl shadow-lg">
              <Image
                src={IMAGES['entrada-finca-loma-bonita'].src}
                alt="Entrada campestre de la Finca Loma Bonita en Piedras de Moler"
                width={IMAGES['entrada-finca-loma-bonita'].w}
                height={IMAGES['entrada-finca-loma-bonita'].h}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 right-4 rounded-xl bg-accent px-5 py-3 text-center text-white shadow-lg sm:right-8">
              <p className="font-display text-2xl font-semibold leading-none">100%</p>
              <p className="mt-1 text-xs">Naturaleza &amp; conexión</p>
            </div>
          </div>

          <div className="space-y-4 lg:pl-4">
            <SectionHeading
              align="left"
              tag="Nuestra esencia"
              title="Un paraíso campestre para compartir y desconectarse"
            />
            <p className="font-medium text-foreground">
              Ubicada estratégicamente en Piedras de Moler, Vía Alcalá Cartago, Finca
              Loma Bonita es el corazón del turismo campestre y ecológico de la región.
            </p>
            <p className="text-muted-foreground">
              Estamos a pasos de la vibrante zona del Río La Vieja, famosa por sus
              espectaculares paisajes y paseos ecológicos, y a muy pocos minutos de los
              principales atractivos y parques temáticos del Eje Cafetero.
            </p>
            <blockquote className="border-l-4 border-accent pl-4 font-display text-lg italic text-cafe">
              “Más que una finca, un lugar para crear recuerdos.”
            </blockquote>
            <p className="text-muted-foreground">
              Ya sea que busques una escapada familiar de fin de semana, una pasadía
              divertida con tus amigos o la locación ideal para la integración de tu
              empresa, aquí encontrarás hospitalidad, alegría y descanso garantizados.
            </p>
            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="rounded-lg border border-border bg-card p-4">
                  <pillar.icon className="size-6 text-accent" aria-hidden="true" />
                  <h3 className="mt-2 font-display font-semibold text-cafe">{pillar.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ubicacion" className="bg-gradient-to-br from-selva to-piscina py-16 text-white sm:py-20">
        <div className="container">
          <SectionHeading
            tone="light"
            tag="Ubicación estratégica"
            title="En el corazón del Eje Cafetero y Piedras de Moler"
            subtitle="Una ubicación privilegiada en la frontera natural de la zona del Río La Vieja, ideal para planes de balsaje y caminatas ecológicas."
          />
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {DISTANCIAS.map((item) => (
              <div key={item.title} className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
                <item.icon className="size-6 text-arcilla" aria-hidden="true" />
                <h3 className="mt-3 font-display font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-white/80">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/contacto"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-white/50 bg-transparent text-white hover:bg-white/10',
              )}
            >
              <MapPin aria-hidden="true" />
              Cómo llegar
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container">
          <SectionHeading
            tag="Galería"
            title="Explora nuestro pedacito de paraíso"
            subtitle="Descubre los rincones, paisajes y momentos felices que te esperan."
          />
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {TEASER.map((item) => (
              <div key={item.image.src} className="overflow-hidden rounded-lg">
                <Image
                  src={item.image.src}
                  alt={item.alt}
                  width={item.image.w}
                  height={item.image.h}
                  sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                  className="aspect-square h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/galeria" className={buttonVariants({ variant: 'outline' })}>
              Ver galería completa
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="container">
          <SectionHeading tag="Dudas frecuentes" title="Preguntas frecuentes" />
          <div className="mt-8">
            <Faq items={FAQS} />
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl bg-selva px-6 py-14 text-center text-white sm:px-12">
            <div
              className="absolute inset-0 bg-gradient-to-br from-selva/60 to-piscina/40"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl space-y-4">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                ¡Planea tu día perfecto hoy mismo!
              </h2>
              <p className="text-white/85">
                Escríbenos y te ayudamos a armar tu plan de pasadía, hospedaje o evento.
                Reservas de {BUSINESS.hours.reservas.toLowerCase()}.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link href="/contacto" className={buttonVariants({ variant: 'accent', size: 'lg' })}>
                  <Clock aria-hidden="true" />
                  Reservar ahora
                </Link>
                <a
                  href={waLink('¡Hola Finca Loma Bonita! Quiero reservar mi visita.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'border-white/50 bg-transparent text-white hover:bg-white/10',
                  )}
                >
                  <WhatsAppIcon className="size-4" />
                  WhatsApp directo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
