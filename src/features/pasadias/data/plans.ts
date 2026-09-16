import { IMAGES, type ImageAsset } from '@/core/lib/images'
import { formatCop } from '@/core/lib/money'
import { COMMON_AREAS } from '@/features/marketing/data/common-areas'

export type PassPlan = {
  id: 'basico' | 'karts' | 'balsaje' | 'cascadas'
  name: string
  price: number
  tagline: string
  description: string
  /** Lo que el plan suma por encima del Plan Básico (vacío en el Básico). */
  extras: { title: string; detail?: string }[]
  image: ImageAsset
  imageAlt: string
  featured?: boolean
}

/** Pila de valor del Plan Básico: todas las áreas comunes + almuerzo. */
export const BASIC_STACK: { title: string; detail: string }[] = [
  ...COMMON_AREAS.map((a) => ({ title: a.title, detail: a.description })),
  {
    title: 'Almuerzo incluido',
    detail: 'Eliges entre varias opciones de nuestra cocina típica disponibles ese día.',
  },
  {
    title: 'Día completo en la finca',
    detail: 'Ingreso desde las 9:00 a.m. para aprovechar todo el día.',
  },
]

export const PASS_PLANS: PassPlan[] = [
  {
    id: 'basico',
    name: 'Plan Básico',
    price: 45_000,
    tagline: 'El día de campo completo',
    description:
      'Piscina, deporte, juegos y almuerzo típico en un solo plan. La forma más fácil de salir de Cartago y pasar un día entero en el campo sin preocuparte por nada.',
    extras: [],
    image: IMAGES['piscina-nocturna'],
    imageAlt: 'Piscina de la Finca Hotel Loma Bonita, incluida en el plan de pasadía',
  },
  {
    id: 'karts',
    name: 'Plan Karts',
    price: 60_000,
    tagline: 'Pasadía + adrenalina',
    description:
      'Todo el Plan Básico y además la emoción de la pista de karts. Para los que quieren algo más que piscina: carreras entre amigos, primos o compañeros de trabajo.',
    extras: [{ title: 'Pista de karts', detail: 'Velocidad y competencia sana en la finca.' }],
    image: IMAGES['primera-seccion-finca-loma-bonita'],
    imageAlt: 'Zonas verdes de la Finca Hotel Loma Bonita para el plan con karts',
  },
  {
    id: 'balsaje',
    name: 'Plan Balsaje',
    price: 110_000,
    tagline: 'La aventura insignia del Río La Vieja',
    description:
      'Todo el Plan Básico más el balsaje por el Río La Vieja: salimos en jeep o Willys desde la finca, pasamos por Alcalá y Quimbaya hasta Puerto Alejandría y desde allí recorres el río en balsa entre paisajes cafeteros.',
    extras: [
      {
        title: 'Transporte en jeep o Willys',
        detail: 'Desde Finca Hotel Loma Bonita hasta Puerto Alejandría, pasando por Alcalá y Quimbaya.',
      },
      {
        title: 'Recorrido en balsa por el Río La Vieja',
        detail: 'El Paisaje Cultural Cafetero visto desde el agua.',
      },
      { title: 'Fiambre típico', detail: 'El almuerzo tradicional envuelto en hoja de plátano.' },
    ],
    image: IMAGES['loma-bonita'],
    imageAlt: 'Paisaje de la Finca Hotel Loma Bonita, punto de partida del balsaje',
    featured: true,
  },
  {
    id: 'cascadas',
    name: 'Plan Cascadas',
    price: 100_000,
    tagline: 'Pasadía + naturaleza viva',
    description:
      'Todo el Plan Básico más una visita a las cascadas de la zona: agua, montaña y verde por todas partes antes de volver a la piscina.',
    extras: [{ title: 'Visita a las cascadas', detail: 'Naturaleza y aire puro en los alrededores.' }],
    image: IMAGES['zonas-de-descanso-vista-a-la-piscina-y-la-montana'],
    imageAlt: 'Vista a la montaña desde la Finca Hotel Loma Bonita',
  },
]

export function planWhatsAppMessage(plan: PassPlan): string {
  return `¡Hola! Quiero reservar el ${plan.name} (${formatCop(plan.price)} por persona) en Finca Hotel Loma Bonita. Fecha: ___ · Personas: ___`
}
