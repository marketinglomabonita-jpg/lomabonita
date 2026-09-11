import Link from 'next/link'
import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { IMAGES } from '@/core/lib/images'
import { breadcrumbJsonLd, buildPageMetadata, JsonLd } from '@/core/lib/seo'
import { PageHero } from '@/features/marketing/components/page-hero'
import { SectionHeading } from '@/features/marketing/components/section-heading'
import { WizardCorporativo } from '@/features/corporativo/components/wizard-corporativo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Experiencias Corporativas — Team building, eventos y pasadías empresariales en el Eje Cafetero',
  description:
    'Organiza pasadías corporativos, team building, eventos empresariales y experiencias de integración para tu equipo en Loma Bonita. Hospedaje, alimentación, actividades dirigidas y acceso a parques del Eje Cafetero.',
  path: '/experiencias-corporativas',
  image: IMAGES['piscina-recreativa'],
  imageAlt: 'Finca Loma Bonita — experiencias corporativas',
})

const TIPOS_EXPERIENCIA = [
  {
    titulo: 'PASADÍA CORPORATIVO',
    descripcion: 'Un día para desconectarse de la rutina y compartir.',
    contenido:
      'Una alternativa para empresas que quieren disfrutar de una jornada diferente sin necesidad de organizar un programa dirigido.',
    incluye: [
      'Acceso a las instalaciones de Loma Bonita',
      'Uso de piscina y áreas recreativas',
      'Acceso a los espacios disponibles para la jornada',
      'Refrigerio',
      'Almuerzo',
      'Tiempo libre para que tu equipo desarrolle su propia agenda',
    ],
    ideal: 'Ideal para: celebraciones, jornadas de bienestar, encuentros de equipo y días de integración.',
  },
  {
    titulo: 'INTEGRACIÓN & TEAM BUILDING',
    descripcion: 'No se trata solamente de pasarla bien. Se trata de conectar al equipo.',
    contenido:
      'Diseña una jornada con actividades dirigidas para trabajar: Trabajo en equipo · Comunicación · Liderazgo · Resolución de conflictos · Confianza · Colaboración · Habilidades blandas.',
    incluye: [
      'Puedes incorporar retos y actividades experienciales diseñados de acuerdo con el objetivo de tu empresa',
      'Y después de la actividad, el equipo puede continuar disfrutando de Loma Bonita y complementar la jornada con otras experiencias',
    ],
    ideal:
      'Puedes agregar: cabalgata, actividades de aventura, bienestar, masajes y otras experiencias disponibles.',
  },
  {
    titulo: 'EVENTOS CORPORATIVOS',
    descripcion: 'El espacio que necesitas para hacer realidad tu propio evento.',
    contenido:
      '¿Tu empresa ya tiene preparada la agenda? Nosotros ponemos el escenario. Encuentra un entorno campestre para realizar: Reuniones empresariales · Capacitaciones · Talleres · Conferencias · Celebraciones · Jornadas de planeación · Encuentros de equipos · Actividades de bienestar.',
    incluye: [
      'Puedes complementar tu evento con alimentación, recreación, hospedaje y otras experiencias',
      'Tú defines el contenido. Nosotros nos encargamos de que el espacio esté listo para vivirlo',
    ],
    ideal: '',
  },
  {
    titulo: 'EXPERIENCIA CORPORATIVA',
    descripcion: 'Cuando quieres mucho más que un día.',
    contenido:
      'Una experiencia diseñada para empresas que quieren combinar trabajo, integración, descanso y aventura. Construye una agenda de uno o varios días y combina: Hospedaje + alimentación + actividades dirigidas + recreación + experiencias + turismo.',
    incluye: [
      'Puedes incorporar actividades de integración, espacios de trabajo, experiencias outdoor, bienestar y diferentes actividades para que cada momento de la jornada tenga un propósito',
      'Y si quieres llevar la experiencia más allá de Loma Bonita, también puedes agregar visitas a algunos de los principales parques y atractivos turísticos del Eje Cafetero',
    ],
    ideal: '',
  },
]

const EXPERIENCIAS_COMPLEMENTO = [
  {
    nombre: 'Cabalgata',
    descripcion: 'Una experiencia para disfrutar el entorno natural y salir de la rutina.',
  },
  {
    nombre: 'Balsaje',
    descripcion: 'Aventura, naturaleza y trabajo en equipo en una experiencia diferente.',
    nota: 'Experiencia insignia — ver ficha completa en',
    link: '/experiencias',
  },
  {
    nombre: 'Pista de Karts',
    descripcion: 'Una dosis de competencia y diversión para el equipo.',
  },
  {
    nombre: 'Bienestar',
    descripcion: 'Masajes y experiencias pensadas para relajarse y desconectarse.',
  },
  {
    nombre: 'Experiencias outdoor',
    descripcion: 'Actividades que llevan al equipo a salir de la rutina y enfrentarse a nuevos retos.',
  },
]

const DESTINOS_EJE_CAFETERO = [
  'Parque Nacional del Café',
  'PANACA',
  'Ukumarí',
  'Parque Los Arrieros',
  'Termales',
]

const COMO_FUNCIONA = [
  {
    numero: '01',
    titulo: 'ELIGE',
    descripcion: 'Cuéntanos qué quieres organizar para tu equipo.',
  },
  {
    numero: '02',
    titulo: 'PERSONALIZA',
    descripcion:
      'Selecciona las actividades, alimentación, hospedaje, experiencias y atractivos que quieras agregar.',
  },
  {
    numero: '03',
    titulo: 'INDICA CUÁNTAS PERSONAS SON',
    descripcion:
      'El valor de tu experiencia se calculará de acuerdo con la cantidad de personas y los servicios seleccionados.',
  },
  {
    numero: '04',
    titulo: 'REVISA',
    descripcion: 'Consulta un valor estimado de tu experiencia antes de solicitar la cotización.',
  },
  {
    numero: '05',
    titulo: 'SOLICITA',
    descripcion: 'Déjanos tus datos y recibe la propuesta personalizada de Loma Bonita.',
  },
]

export default function ExperienciasCorporativasPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Experiencias Corporativas', path: '/experiencias-corporativas' },
        ])}
      />
      <PageHero
        tag="Experiencias corporativas"
        title="Tu equipo merece algo más que una reunión"
        description="Convierte una jornada de trabajo, integración o celebración en una experiencia que tu equipo realmente recuerde. En Loma Bonita puedes organizar desde un pasadía corporativo hasta experiencias de integración, actividades de team building, eventos empresariales, hospedaje y recorridos por algunos de los principales atractivos del Eje Cafetero."
        image={IMAGES['piscina-recreativa']}
        imageAlt="Finca Loma Bonita — experiencias corporativas"
      />

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-lg font-semibold uppercase tracking-wide text-amber-900">
            Tú eliges el objetivo. Nosotros te ayudamos a construir la experiencia.
          </p>
          <Link
            href="#wizard"
            className="inline-flex h-11 items-center justify-center rounded-md bg-amber-900 px-8 text-sm font-semibold text-white hover:bg-amber-800"
          >
            ARMA TU EXPERIENCIA
          </Link>
        </div>
      </section>

      {/* ¿Qué necesita tu empresa? */}
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container">
          <SectionHeading
            title="¿QUÉ NECESITA TU EMPRESA?"
            subtitle="No todas las empresas buscan lo mismo. Por eso creamos diferentes formas de vivir Loma Bonita con tu equipo."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {TIPOS_EXPERIENCIA.map((tipo, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white p-6 md:p-8">
                <h3 className="mb-2 text-xl font-bold uppercase tracking-wide text-amber-900">{tipo.titulo}</h3>
                <p className="mb-4 text-lg font-medium text-neutral-900">{tipo.descripcion}</p>
                <p className="mb-4 text-neutral-700">{tipo.contenido}</p>
                {tipo.incluye.length > 0 && (
                  <ul className="mb-4 space-y-2">
                    {tipo.incluye.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-neutral-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {tipo.ideal && <p className="text-sm font-medium text-amber-800">{tipo.ideal}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tu empresa. Tu objetivo. Tu experiencia. */}
      <section className="py-16 md:py-24">
        <div className="container">
          <SectionHeading
            title="TU EMPRESA. TU OBJETIVO. TU EXPERIENCIA."
            subtitle="Combina diferentes opciones y crea un plan a la medida. No tienes que conformarte con un paquete predeterminado."
          />
          <div className="mx-auto mt-12 max-w-3xl">
            <p className="text-center text-lg text-neutral-700">
              Puedes construir una experiencia de acuerdo con: Número de personas · Fecha y duración · Hospedaje ·
              Alimentación · Espacios y recreación · Actividades de integración · Experiencias outdoor · Bienestar y
              relajación · Parques y atractivos turísticos.
            </p>
          </div>
        </div>
      </section>

      {/* Experiencias para complementar tu plan */}
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container">
          <SectionHeading
            title="EXPERIENCIAS PARA COMPLEMENTAR TU PLAN"
            subtitle="Agrega momentos que hagan diferente la jornada."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIENCIAS_COMPLEMENTO.map((exp, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white p-6">
                <h4 className="mb-2 font-bold text-amber-900">{exp.nombre}</h4>
                <p className="text-sm text-neutral-700">{exp.descripcion}</p>
                {exp.nota && exp.link && (
                  <p className="mt-2 text-sm text-neutral-600">
                    {exp.nota}{' '}
                    <Link href={exp.link} className="font-medium text-amber-900 underline hover:text-amber-700">
                      /experiencias
                    </Link>
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-neutral-600">
            Las experiencias disponibles pueden variar según fecha, disponibilidad y condiciones de cada actividad.
          </p>
        </div>
      </section>

      {/* Descubre el Eje Cafetero */}
      <section className="py-16 md:py-24">
        <div className="container">
          <SectionHeading
            title="DESCUBRE EL EJE CAFETERO"
            subtitle="Tu experiencia no tiene que terminar en Loma Bonita. Aprovecha tu visita para conocer algunos de los destinos turísticos más reconocidos de la región. Puedes agregar a tu plan entradas o pasaportes para diferentes parques y atractivos del Eje Cafetero."
          />
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="mb-6 flex flex-wrap justify-center gap-4">
              {DESTINOS_EJE_CAFETERO.map((destino, i) => (
                <div key={i} className="rounded-full border border-amber-900 bg-amber-50 px-4 py-2 font-medium">
                  {destino}
                </div>
              ))}
            </div>
            <p className="text-center text-neutral-700">
              Y otros destinos disponibles. Consulta las opciones y tarifas especiales disponibles para tu grupo.
            </p>
          </div>
        </div>
      </section>

      {/* ¿Cómo funciona? */}
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container">
          <SectionHeading title="¿CÓMO FUNCIONA?" />
          <div className="mx-auto mt-12 grid max-w-4xl gap-6">
            {COMO_FUNCIONA.map((paso, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-900 text-lg font-bold text-white">
                  {paso.numero}
                </div>
                <div>
                  <h4 className="mb-1 font-bold uppercase tracking-wide text-amber-900">{paso.titulo}</h4>
                  <p className="text-neutral-700">{paso.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wizard */}
      <section id="wizard" className="scroll-mt-24 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
              ARMA TU EXPERIENCIA
            </h2>
            <p className="text-lg text-neutral-700">
              ¿Listo para construir el plan de tu equipo? Selecciona lo que necesitas y nosotros calculamos un valor
              estimado para tu grupo.
            </p>
          </div>
          <WizardCorporativo />
        </div>
      </section>

      {/* Nota sobre precios */}
      <section className="bg-amber-50 py-8">
        <div className="container">
          <p className="text-center text-sm text-neutral-700">
            Los precios mostrados son valores de referencia. La cotización final puede variar según disponibilidad,
            temporada y condiciones específicas de tu grupo.
          </p>
        </div>
      </section>
    </>
  )
}
