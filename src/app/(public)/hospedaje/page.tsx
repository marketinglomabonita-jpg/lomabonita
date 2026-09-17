import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Baby, BedDouble, Clock, LogIn, MapPin, Users, UtensilsCrossed } from 'lucide-react'
import { IMAGES } from '@/core/lib/images'
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  JsonLd,
  offerCatalogJsonLd,
} from '@/core/lib/seo'
import { buttonVariants } from '@/core/ui/button'
import { waLink } from '@/core/lib/contact'
import { formatCop } from '@/core/lib/money'
import { Faq, type FaqItem } from '@/features/marketing/components/faq'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { ValueStack } from '@/features/marketing/components/value-stack'
import { WhatsAppBooking } from '@/features/marketing/components/whatsapp-booking'
import { WhatsAppIcon } from '@/features/marketing/components/brand-icons'
import { COMMON_AREAS } from '@/features/marketing/data/common-areas'
import { NEARBY_PLACES } from '@/features/marketing/data/nearby'
import {
  describeBeds,
  COUPLE_RATE,
  FREE_CHILD_AGE,
  PERSON_RATE,
  roomCapacity,
  ROOMS,
  roomWhatsAppMessage,
  TOTAL_CAPACITY,
  type Room,
} from '@/features/hospedaje/data/rooms'
import { PASS_PLANS } from '@/features/pasadias/data/plans'

const PAGE_DESCRIPTION = `Hospedaje campestre en Cartago, vía Alcalá: ${formatCop(PERSON_RATE)} por persona la noche con desayuno y cena incluidos (niños menores de ${FREE_CHILD_AGE} años gratis), más piscina, minifútbol, billar y gimnasio. 10 habitaciones para parejas, familias y grupos. Cerca del Parque del Café, PANACA y Ukumarí.`

export const metadata: Metadata = buildPageMetadata({
  title: 'Hospedaje campestre en Cartago — Finca hotel en el Eje Cafetero',
  description: PAGE_DESCRIPTION,
  path: '/hospedaje',
  image: IMAGES['habitaciones-1-vertical'],
  imageAlt: 'Habitación campestre de la Finca Hotel Loma Bonita en Cartago',
})

const DATOS = [
  { icon: BedDouble, label: 'Tarifa por persona', value: `${formatCop(PERSON_RATE)} / noche · pareja ${formatCop(COUPLE_RATE)}` },
  { icon: Baby, label: 'Niños', value: `Menores de ${FREE_CHILD_AGE} años no pagan` },
  { icon: UtensilsCrossed, label: 'Incluye', value: 'Desayuno y cena' },
  { icon: Users, label: 'Capacidad', value: `10 habitaciones · hasta ${TOTAL_CAPACITY} huéspedes` },
  { icon: LogIn, label: 'Check-in / out', value: '3:00 p.m. · 1:00 p.m.' },
]

const STAY_STACK = [
  { title: 'Desayuno incluido', detail: 'Empieza el día con un desayuno campestre en la finca.' },
  { title: 'Cena incluida', detail: 'Cierra la jornada con la cena servida en nuestro restaurante.' },
  ...COMMON_AREAS.map((a) => ({ title: a.title, detail: a.description })),
  { title: 'Ambiente campestre y familiar', detail: 'Aire puro, zonas verdes y descanso lejos del ruido.' },
  { title: 'Ubicación estratégica', detail: 'Entre Cartago y Alcalá, con los parques del Eje Cafetero a la mano.' },
]

const COMBO_PLANS = PASS_PLANS.filter((p) => p.id !== 'basico')

const FAQS: FaqItem[] = [
  {
    question: '¿Cuánto cuesta una noche en Finca Hotel Loma Bonita?',
    answer: `La tarifa es de ${formatCop(PERSON_RATE)} por persona por noche (${formatCop(COUPLE_RATE)} una pareja) e incluye desayuno, cena y todas las áreas comunes.`,
  },
  {
    question: '¿Los niños pagan hospedaje?',
    answer: `Los niños menores de ${FREE_CHILD_AGE} años no pagan. Desde los ${FREE_CHILD_AGE} años pagan la tarifa normal de ${formatCop(PERSON_RATE)} por noche, con desayuno y cena incluidos.`,
  },
  {
    question: '¿Qué incluye el hospedaje?',
    answer:
      'Todas las habitaciones incluyen desayuno, cena y el uso de las áreas comunes: piscina, zona de restaurante, juegos infantiles, cancha de minifútbol, salón de billar y juegos de mesa, gimnasio, parqueadero y tienda de mecatos.',
  },
  {
    question: '¿Cómo reservo una habitación?',
    answer:
      'Por ahora las reservas son directas por WhatsApp y sujetas a disponibilidad: nos escribes con fechas y número de personas, te confirmamos disponibilidad y valor, y separas tu habitación.',
  },
  {
    question: '¿Tienen habitaciones para grupos grandes?',
    answer:
      'Sí. Las habitaciones 1 y 2 reciben hasta 10 personas cada una (3 camas dobles y 4 sencillas), ideales para familias extensas, excursiones e integraciones.',
  },
  {
    question: '¿Qué tan cerca están del Parque del Café y PANACA?',
    answer:
      'La finca está en Piedras de Moler, vía Cartago–Alcalá, a unos 40–45 minutos del Parque del Café y de PANACA, y a menos de una hora del Bioparque Ukumarí. Es una base cómoda para recorrer el Eje Cafetero.',
  },
  {
    question: '¿Puedo combinar el hospedaje con otras experiencias?',
    answer:
      'Sí. Puedes sumar a tu estadía la pista de karts, el balsaje por el Río La Vieja o la visita a las cascadas. Pregúntanos por WhatsApp y armamos el combo.',
  },
]

export default function HospedajePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Hospedaje', path: '/hospedaje' },
        ])}
      />
      <JsonLd
        data={offerCatalogJsonLd({
          name: 'Habitaciones Finca Hotel Loma Bonita',
          path: '/hospedaje',
          offers: ROOMS.map((room) => ({
            name: `${room.name} (Habitación ${room.number})`,
            description: `${describeBeds(room.beds).join(', ')}. Hasta ${roomCapacity(room.beds)} personas. Tarifa por persona con desayuno, cena y áreas comunes incluidos; menores de ${FREE_CHILD_AGE} años gratis.`,
            price: PERSON_RATE,
          })),
        })}
      />
      <JsonLd data={faqJsonLd(FAQS)} />

      <PageHero
        tag="Hospedaje campestre en Cartago"
        title="Duerme en el campo, despierta en el Eje Cafetero"
        description={`${formatCop(PERSON_RATE)} por persona la noche, con desayuno y cena incluidos. Niños menores de ${FREE_CHILD_AGE} años gratis. 10 habitaciones en Piedras de Moler, vía Alcalá, con piscina, zonas de juego, gimnasio y todo lo que hace de Loma Bonita un plan completo.`}
        image={IMAGES['habitaciones-2-vertical']}
        imageAlt="Habitación familiar de la Finca Hotel Loma Bonita"
      />

      <section className="border-b border-border bg-muted/40">
        <div className="container grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-5">
          {DATOS.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <d.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{d.label}</p>
                <p className="text-sm font-medium">{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <SectionHeading
              align="left"
              tag="Todo incluido en tu habitación"
              title="No reservas solo una cama: reservas toda la experiencia"
            />
            <p className="text-muted-foreground">
              En Loma Bonita tu habitación incluye todas las áreas comunes que disfrutan nuestros visitantes
              de pasadía, sin pagar entrada aparte. Te despiertas y la piscina está ahí; los niños
              tienen su zona de juegos, los grandes su partido de minifútbol y su mesa de billar,
              y en el restaurante te esperan el desayuno y la cena, ya incluidos en tu tarifa.
            </p>
            <p className="text-muted-foreground">
              Es el hospedaje campestre ideal si vives en Cartago y quieres desconectarte sin
              manejar horas, o si vienes a recorrer el Eje Cafetero y buscas una base tranquila,
              con buen precio y espacio para toda la familia.
            </p>
          </div>
          <ValueStack
            items={STAY_STACK}
            footer={
              <p className="text-sm">
                <span className="font-semibold text-cafe">Todo esto incluido</span> en cada
                habitación, por{' '}
                <span className="font-semibold text-cafe">{formatCop(PERSON_RATE)}</span> por persona
                la noche. Niños menores de {FREE_CHILD_AGE} años gratis.
              </p>
            }
          />
        </div>
      </section>

      <section className="bg-muted/40 py-16" id="habitaciones">
        <div className="container space-y-10">
          <SectionHeading
            tag="Nuestras habitaciones"
            title="10 habitaciones, una para cada tipo de viaje"
            subtitle="Desde la escapada en pareja hasta el paseo de toda la familia. Todas sujetas a disponibilidad y con reserva directa por WhatsApp."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ROOMS.map((room) => (
              <RoomCard key={room.slug} room={room} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" id="combos">
        <div className="container space-y-10">
          <SectionHeading
            tag="Combos de hospedaje"
            title="Suma una experiencia a tu estadía"
            subtitle="Tu noche en la finca más una aventura del Eje Cafetero. Cuéntanos qué combo quieres y te enviamos el valor."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {COMBO_PLANS.map((plan) => (
              <article
                key={plan.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <Image
                  src={plan.image.src}
                  alt={plan.imageAlt}
                  width={plan.image.w}
                  height={plan.image.h}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="h-44 w-full object-cover"
                />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Hospedaje + {plan.emoji} {plan.name}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-cafe">{plan.tagline}</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Noche en la habitación que elijas</li>
                    <li>• Desayuno y cena</li>
                    <li>• Todas las áreas comunes de la finca</li>
                    {plan.extras.map((extra) => (
                      <li key={extra.title}>• {extra.title}</li>
                    ))}
                  </ul>
                  <a
                    href={waLink(
                      `¡Hola! Quiero cotizar el combo Hospedaje + ${plan.name} en Finca Hotel Loma Bonita. Fechas: ___ · Adultos: ___ · Niños (edades): ___`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonVariants({ variant: 'outline' })} mt-auto`}
                  >
                    <WhatsAppIcon className="size-4" />
                    Cotizar combo
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            ¿Solo vienes por el día?{' '}
            <Link href="/pasadias" className="font-medium text-primary hover:underline">
              Mira nuestras pasadías Loma
            </Link>{' '}
            o{' '}
            <Link href="/restaurante" className="font-medium text-primary hover:underline">
              la carta del restaurante
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container space-y-8">
          <SectionHeading
            tag="Qué hacer cerca"
            title="Tu base para recorrer el Eje Cafetero"
            subtitle="Hospédate entre Cartago y Alcalá y ten a la mano los planes más buscados de la región."
          />
          <ul className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NEARBY_PLACES.map((place) => (
              <li key={place.name} className="flex gap-3 rounded-xl border border-border bg-card p-5">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-cafe">{place.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{place.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16">
        <div className="container space-y-12">
          <WhatsAppBooking
            title="¿Cómo reservar tu habitación?"
            steps={[
              'Escríbenos por WhatsApp con tus fechas, cuántos adultos y niños vienen (con sus edades) y la habitación que te gustó.',
              'Te confirmamos disponibilidad y el valor final de tu estadía.',
              `Separas tu reserva y llegas desde las 3:00 p.m. El check-out es a la 1:00 p.m.`,
            ]}
            message="¡Hola! Quiero reservar hospedaje en Finca Hotel Loma Bonita. Fechas: ___ · Adultos: ___ · Niños (edades): ___"
            cta="Consultar disponibilidad"
          />
          <div className="space-y-6">
            <SectionHeading tag="Preguntas frecuentes" title="Lo que más nos preguntan" />
            <Faq items={FAQS} />
          </div>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            Todas las reservas están sujetas a disponibilidad.
          </p>
        </div>
      </section>
    </>
  )
}

function RoomCard({ room }: { room: Room }) {
  const capacity = roomCapacity(room.beds)
  return (
    <article
      id={room.slug}
      className="flex scroll-mt-24 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="relative">
        <Image
          src={room.image.src}
          alt={room.imageAlt}
          width={room.image.w}
          height={room.image.h}
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="h-56 w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          {room.badge}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
          Habitación {room.number}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl font-semibold text-cafe">{room.name}</h3>
          <p className="text-xs font-medium text-accent">{room.idealFor}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{room.description}</p>
        <div className="flex flex-wrap gap-2">
          {describeBeds(room.beds).map((bed) => (
            <span
              key={bed}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
            >
              <BedDouble className="size-3.5 text-primary" aria-hidden="true" />
              {bed}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            <Users className="size-3.5 text-primary" aria-hidden="true" />
            Hasta {capacity} {capacity === 1 ? 'persona' : 'personas'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Incluye desayuno, cena, piscina, juegos, minifútbol, billar, gimnasio y parqueadero.
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm">
            <span className="block text-xs text-muted-foreground">Por persona / noche</span>
            <span className="text-lg font-semibold text-cafe">{formatCop(PERSON_RATE)}</span>
          </p>
          <a
            href={waLink(roomWhatsAppMessage(room))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'accent', size: 'sm' })}
          >
            <WhatsAppIcon className="size-4" />
            Reservar
          </a>
        </div>
      </div>
    </article>
  )
}
