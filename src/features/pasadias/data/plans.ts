import { IMAGES, type ImageAsset } from '@/core/lib/images'
import { formatCop } from '@/core/lib/money'
import { COMMON_AREAS } from '@/features/marketing/data/common-areas'

export type PassPlan = {
  id: 'basico' | 'karts' | 'balsaje' | 'cascadas'
  name: string
  emoji: string
  price: number
  tagline: string
  description: string
  /** Lo que la pasadía suma por encima de Loma Relax (vacío en Loma Relax). */
  extras: { title: string; detail?: string }[]
  image: ImageAsset
  imageAlt: string
  featured?: boolean
}

/** Pila de valor de Loma Relax: todas las áreas comunes + almuerzo. */
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
    name: 'Loma Relax',
    emoji: '🌿',
    price: 45_000,
    tagline: 'El día de campo completo',
    description:
      'Piscina, deporte, juegos y almuerzo típico en un solo plan. La forma más fácil de salir de Cartago y pasar un día entero en el campo sin preocuparte por nada.',
    extras: [],
    image: IMAGES['piscina-nocturna'],
    imageAlt: 'Piscina de la Finca Hotel Loma Bonita, incluida en la pasadía Loma Relax',
  },
  {
    id: 'karts',
    name: 'Loma Racing',
    emoji: '🏎️',
    price: 60_000,
    tagline: 'Relax + adrenalina',
    description:
      'Todo lo de Loma Relax y además la emoción de la pista de karts. Para los que quieren algo más que piscina: carreras entre amigos, primos o compañeros de trabajo.',
    extras: [{ title: 'Pista de karts', detail: 'Velocidad y competencia sana en la finca.' }],
    image: IMAGES['primera-seccion-finca-loma-bonita'],
    imageAlt: 'Zonas verdes de la Finca Hotel Loma Bonita para la pasadía Loma Racing',
  },
  {
    id: 'balsaje',
    name: 'Loma Aventura Balsaje',
    emoji: '🛶',
    price: 110_000,
    tagline: 'La aventura insignia del Río La Vieja',
    description:
      'Todo lo de Loma Relax más el balsaje por el Río La Vieja: salimos en jeep o Willys desde la finca, pasamos por Alcalá y Quimbaya hasta Puerto Alejandría y desde allí recorres el río en balsa entre paisajes cafeteros.',
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
    name: 'Loma Aventura Cascadas',
    emoji: '💦',
    price: 100_000,
    tagline: 'Río, selva y la Cascada Los Micos',
    description:
      'Todo lo de Loma Relax más la aventura completa a la Cascada Los Micos: navegas el Río La Vieja en bote desde la finca, caminas unos 20 minutos entre naturaleza y llegas a una cascada donde puedes bañarte. Después, regreso en bote hasta Loma Bonita y de vuelta a la piscina.',
    extras: [
      {
        title: 'Paseo en bote por el Río La Vieja',
        detail: 'Sales navegando desde Finca Hotel Loma Bonita, entre paisajes del Eje Cafetero.',
      },
      {
        title: 'Caminata guiada de unos 20 minutos',
        detail: 'Un recorrido entre naturaleza viva, sombra y sonido de agua hasta la cascada.',
      },
      {
        title: 'Baño en la Cascada Los Micos',
        detail: 'Agua fresca de montaña para nadar y refrescarse en plena selva.',
      },
      {
        title: 'Regreso en bote hasta la finca',
        detail: 'El río otra vez, de vuelta a la piscina y a las zonas de descanso.',
      },
    ],
    image: IMAGES['zonas-de-descanso-vista-a-la-piscina-y-la-montana'],
    imageAlt: 'Vista a la montaña desde la Finca Hotel Loma Bonita',
  },
]

export function planWhatsAppMessage(plan: PassPlan): string {
  return `¡Hola! Quiero reservar la pasadía ${plan.emoji} ${plan.name} (${formatCop(plan.price)} por persona) en Finca Hotel Loma Bonita. Fecha: ___ · Personas: ___`
}
