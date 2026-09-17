import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Bus, Clock, ParkingCircle, Sailboat, ShieldCheck, Sun } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { IMAGES, type ImageAsset } from '@/core/lib/images'
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  JsonLd,
  offerCatalogJsonLd,
} from '@/core/lib/seo'
import { cn } from '@/core/lib/utils'
import { buttonVariants } from '@/core/ui/button'
import { waLink } from '@/core/lib/contact'
import { formatCop } from '@/core/lib/money'
import { Faq, type FaqItem } from '@/features/marketing/components/faq'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { ValueStack } from '@/features/marketing/components/value-stack'
import { WhatsAppBooking } from '@/features/marketing/components/whatsapp-booking'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import {
  BASIC_STACK,
  PASS_PLANS,
  planWhatsAppMessage,
  type PassPlan,
} from '@/features/pasadias/data/plans'

const priceOf = (id: PassPlan['id']) => formatCop(PASS_PLANS.find((p) => p.id === id)?.price ?? 0)
const BASIC_PRICE = priceOf('basico')

export const metadata: Metadata = buildPageMetadata({
  title: `Pasadía en Cartago con piscina y almuerzo desde ${BASIC_PRICE}`,
  description: `Pasadía en Cartago, vía Alcalá, desde ${BASIC_PRICE}: piscina, almuerzo típico, minifútbol, billar, juegos infantiles y gimnasio. Loma Relax, Loma Racing con karts, Loma Aventura de Río con balsaje por el Río La Vieja y Loma Cascadas.`,
  path: '/pasadias',
  image: IMAGES['piscina-recreativa'],
  imageAlt: 'Piscina recreativa de la Finca Hotel Loma Bonita para pasadía en Cartago',
})

const CONDICIONES = [
  { icon: Sun, title: 'Horario', text: `${BUSINESS.hours.pasadia}. Llega temprano y aprovecha el día completo.` },
  { icon: Clock, title: 'Reserva previa', text: `Cupos sujetos a disponibilidad. Atendemos reservas ${BUSINESS.hours.reservas.toLowerCase()}.` },
  { icon: ParkingCircle, title: 'Parqueadero', text: 'Parqueadero privado dentro de la finca.' },
  { icon: ShieldCheck, title: 'Ambiente familiar', text: 'Ambiente sano y tranquilo para niños, jóvenes, adultos y grupos.' },
]

const ZONAS: { image: ImageAsset; alt: string; caption: string }[] = [
  { image: IMAGES['piscina-recreativa'], alt: 'Piscina recreativa para pasadía en Cartago', caption: 'Piscina recreativa' },
  { image: IMAGES['cancha-de-futbol'], alt: 'Cancha de minifútbol de la finca', caption: 'Cancha de minifútbol' },
  { image: IMAGES['sala-de-juegos-billar-rana'], alt: 'Salón de billar y juegos de mesa', caption: 'Billar y juegos' },
  { image: IMAGES['zona-infantil'], alt: 'Zona de juegos infantiles', caption: 'Juegos infantiles' },
  { image: IMAGES['pasadia-con-almuerzo-vertical'], alt: 'Almuerzo típico incluido en la pasadía', caption: 'Almuerzo incluido' },
  { image: IMAGES['zona-de-amacas-descanso'], alt: 'Zona de hamacas para descansar', caption: 'Zonas de descanso' },
]

const FAQS: FaqItem[] = [
  {
    question: '¿Cuánto vale la pasadía en Finca Hotel Loma Bonita?',
    answer: `Loma Relax cuesta ${BASIC_PRICE} por persona e incluye todas las áreas comunes y el almuerzo. También tenemos Loma Racing (${priceOf('karts')}), Loma Cascadas (${priceOf('cascadas')}) y Loma Aventura de Río (${priceOf('balsaje')}).`,
  },
  {
    question: '¿Qué incluye Loma Relax?',
    answer:
      'Piscina, zona de restaurante, juegos infantiles, cancha de minifútbol, salón de billar y juegos de mesa, gimnasio, parqueadero, tienda de mecatos y almuerzo a elegir entre las opciones disponibles del día.',
  },
  {
    question: '¿Cómo es Loma Aventura de Río, el balsaje por el Río La Vieja?',
    answer:
      'Incluye todo lo de Loma Relax, transporte en jeep o Willys desde la finca hasta Puerto Alejandría pasando por Alcalá y Quimbaya, el recorrido en balsa por el Río La Vieja disfrutando del paisaje y un fiambre típico.',
  },
  {
    question: '¿Cómo reservo mi pasadía?',
    answer:
      'Escríbenos por WhatsApp con la fecha, la pasadía que elegiste y el número de personas. Te confirmamos disponibilidad y separas tu cupo. Todas las pasadías están sujetas a disponibilidad.',
  },
  {
    question: '¿Dónde queda la finca para una pasadía cerca de Cartago?',
    answer:
      'En Piedras de Moler, sobre la vía Cartago–Alcalá, a pocos minutos de Cartago y junto al Río La Vieja, en el límite entre Valle del Cauca y Quindío.',
  },
  {
    question: '¿Las pasadías sirven para grupos y empresas?',
    answer:
      'Sí. Recibimos familias, grupos de amigos y empresas. Para integraciones corporativas también puedes ver nuestro portafolio de experiencias corporativas.',
  },
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
      <JsonLd
        data={offerCatalogJsonLd({
          name: 'Pasadías Finca Hotel Loma Bonita',
          path: '/pasadias',
          offers: PASS_PLANS.map((p) => ({ name: p.name, description: p.description, price: p.price })),
        })}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <PageHero
        tag="Pasadía en Cartago"
        title="Un día entero de piscina, sol y almuerzo típico"
        description={`Pasadías desde ${BASIC_PRICE} por persona en Piedras de Moler, vía Alcalá. Todo incluido: piscina, deporte, juegos, gimnasio y almuerzo. Súmale karts, cascadas o balsaje por el Río La Vieja.`}
        image={IMAGES['piscina-recreativa']}
        imageAlt="Piscina recreativa de la Finca Hotel Loma Bonita"
      />

      <nav aria-label="Pasadías disponibles" className="border-b border-border bg-muted/40">
        <div className="container grid grid-cols-2 gap-3 py-6 lg:grid-cols-4">
          {PASS_PLANS.map((plan) => (
            <a
              key={plan.id}
              href={`#plan-${plan.id}`}
              className="rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                <span aria-hidden="true">{plan.emoji}</span> {plan.name}
              </p>
              <p className="text-lg font-semibold text-cafe">{formatCop(plan.price)}</p>
            </a>
          ))}
        </div>
      </nav>

      <section className="py-16">
        <div className="container space-y-10">
          <SectionHeading
            tag="Pasadías Loma"
            title="Elige tu pasadía: todas incluyen la finca completa"
            subtitle="Cada pasadía trae todo lo de Loma Relax. Racing, Aventura de Río y Cascadas suman la emoción encima."
          />
          <div className="grid items-start gap-8 lg:grid-cols-2">
            {PASS_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Valores por persona. Todas las pasadías están sujetas a disponibilidad.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <SectionHeading
              align="left"
              tag="La mejor pasadía cerca de Cartago"
              title="Tu fin de semana en el campo, a minutos de la ciudad"
            />
            <p className="text-muted-foreground">
              Si vives en Cartago o en el norte del Valle y buscas qué hacer el fin de semana,
              Loma Bonita es la salida más fácil: tomas la vía a Alcalá y en pocos minutos
              estás en el campo, con piscina, zonas verdes y almuerzo típico sin tener que
              organizar nada.
            </p>
            <p className="text-muted-foreground">
              Y si vienes de paseo por el Eje Cafetero, la finca queda en el borde entre Valle y
              Quindío, junto al Río La Vieja y a unos 40–45 minutos del Parque del Café y
              PANACA: un buen lugar para descansar entre parque y parque.
            </p>
            <p className="text-sm">
              ¿Quieres quedarte la noche?{' '}
              <Link href="/hospedaje" className="font-medium text-primary hover:underline">
                Conoce nuestro hospedaje
              </Link>
              : cada habitación incluye todas las áreas comunes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ZONAS.map((zona) => (
              <figure key={zona.caption} className="overflow-hidden rounded-xl shadow-sm">
                <Image
                  src={zona.image.src}
                  alt={zona.alt}
                  width={zona.image.w}
                  height={zona.image.h}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="h-36 w-full object-cover sm:h-44"
                />
                <figcaption className="bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  {zona.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-4xl space-y-6">
          <SectionHeading
            tag="Balsaje por el Río La Vieja"
            title="La aventura más tradicional del Eje Cafetero, saliendo desde la finca"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl border border-border bg-card p-5">
              <Bus className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-cafe">Ruta en jeep o Willys.</span> Salimos de
                Finca Hotel Loma Bonita en jeep o en el clásico Willys cafetero, pasamos por Alcalá y
                Quimbaya y llegamos a Puerto Alejandría, a orillas del río.
              </p>
            </div>
            <div className="flex gap-3 rounded-xl border border-border bg-card p-5">
              <Sailboat className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-cafe">Recorrido en balsa.</span> Navegas el Río
                La Vieja entre el Valle y el Quindío, disfrutando del paisaje y de un fiambre
                típico, como manda la tradición del paseo de río.
              </p>
            </div>
          </div>
          <div className="text-center">
            <a
              href={waLink(planWhatsAppMessage(PASS_PLANS.find((p) => p.id === 'balsaje') ?? PASS_PLANS[0]))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'accent' })}
            >
              <WhatsAppIcon className="size-4" />
              Reservar Loma Aventura de Río
            </a>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading tag="Antes de venir" title="Horarios y condiciones" />
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
            {CONDICIONES.map((c) => (
              <div key={c.title} className="flex gap-3 rounded-xl border border-border bg-card p-5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <c.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-cafe">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container space-y-12">
          <WhatsAppBooking
            title="¿Cómo reservar tu pasadía?"
            steps={[
              'Elige tu pasadía: Loma Relax, Loma Racing, Loma Cascadas o Loma Aventura de Río.',
              'Escríbenos por WhatsApp con la fecha y el número de personas.',
              'Te confirmamos disponibilidad, separas tu cupo y llegas desde las 9:00 a.m.',
            ]}
            message="¡Hola! Quiero reservar una pasadía en Finca Hotel Loma Bonita. Pasadía: ___ · Fecha: ___ · Personas: ___"
            cta="Reservar por WhatsApp"
          />
          <div className="space-y-6">
            <SectionHeading tag="Preguntas frecuentes" title="Todo sobre nuestras pasadías" />
            <Faq items={FAQS} />
          </div>
        </div>
      </section>
    </>
  )
}

function PlanCard({ plan }: { plan: PassPlan }) {
  const isBasic = plan.extras.length === 0
  return (
    <article
      id={`plan-${plan.id}`}
      className={cn(
        'scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-sm',
        plan.featured ? 'border-accent ring-2 ring-accent/30' : 'border-border',
      )}
    >
      <div className="relative">
        <Image
          src={plan.image.src}
          alt={plan.imageAlt}
          width={plan.image.w}
          height={plan.image.h}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="h-48 w-full object-cover"
        />
        {plan.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            Aventura insignia
          </span>
        )}
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{plan.tagline}</p>
            <h3 className="font-display text-2xl font-semibold text-cafe">
              <span aria-hidden="true">{plan.emoji}</span> {plan.name}
            </h3>
          </div>
          <p className="sm:text-right">
            <span className="text-3xl font-bold text-cafe">{formatCop(plan.price)}</span>
            <span className="block text-xs text-muted-foreground">por persona</span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        <ValueStack
          items={BASIC_STACK}
          highlights={plan.extras}
          footer={
            <p className="text-sm">
              {isBasic ? 'Todo esto' : `Todo lo de Loma Relax + ${plan.extras.length === 1 ? plan.extras[0].title.toLowerCase() : 'la experiencia completa'}`}{' '}
              por solo <span className="font-semibold text-cafe">{formatCop(plan.price)}</span>
            </p>
          }
        />
        <a
          href={waLink(planWhatsAppMessage(plan))}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: plan.featured ? 'accent' : 'primary' }), 'w-full')}
        >
          <WhatsAppIcon className="size-4" />
          Reservar {plan.name}
        </a>
      </div>
    </article>
  )
}
