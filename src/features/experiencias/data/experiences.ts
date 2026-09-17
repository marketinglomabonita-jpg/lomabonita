import { PASS_PLANS } from '@/features/pasadias/data/plans'
import { formatCop } from '@/core/lib/money'

export type Experience = {
  id: 'karts' | 'cascadas' | 'balsaje'
  title: string
  tagline: string
  description: string
  details: string[]
  ctaMessage: string
  featured?: boolean
}

function planPrice(id: Experience['id']): string {
  const plan = PASS_PLANS.find((p) => p.id === id)
  return plan ? `${plan.emoji} ${plan.name}: ${formatCop(plan.price)} por persona` : ''
}

/**
 * Experiencias reales (se venden como pasadias Loma: Loma Relax + experiencia).
 * Reservas por WhatsApp, sujetas a disponibilidad; el motor de tickets llega en la v3.
 */
export const EXPERIENCES: Experience[] = [
  {
    id: 'karts',
    title: 'Pista de karts',
    tagline: 'Adrenalina entre las montañas',
    description:
      'Siente la velocidad en nuestra pista de karts, el complemento perfecto para tu pasadía o tu estadía. Compite con tu familia, tus amigos o tu equipo de trabajo en un ambiente campestre.',
    details: [
      'Incluye todo lo de la pasadía Loma Relax',
      'Ideal para jóvenes, adultos y grupos',
      planPrice('karts'),
    ],
    ctaMessage: '¡Hola! Quiero reservar la pasadía Loma Racing en Finca Hotel Loma Bonita.',
  },
  {
    id: 'cascadas',
    title: 'Visita a las cascadas',
    tagline: 'Agua, montaña y naturaleza',
    description:
      'Sal de la piscina y conoce las cascadas de la zona: un plan de naturaleza para respirar aire puro y ver de cerca el paisaje del norte del Valle y el Eje Cafetero.',
    details: [
      'Incluye todo lo de la pasadía Loma Relax',
      'Plan de naturaleza para familias y amigos',
      planPrice('cascadas'),
    ],
    ctaMessage: '¡Hola! Quiero reservar la pasadía Loma Cascadas en Finca Hotel Loma Bonita.',
  },
  {
    id: 'balsaje',
    title: 'Balsaje por el Río La Vieja',
    tagline: 'La experiencia insignia de la región',
    description:
      'La aventura más tradicional del Eje Cafetero, organizada desde la finca. Sales de Loma Bonita en jeep o Willys, pasas por Alcalá y Quimbaya hasta Puerto Alejandría y desde allí recorres el Río La Vieja en balsa, entre paisajes cafeteros y con un fiambre típico para el camino.',
    details: [
      'Transporte en jeep o Willys desde la finca',
      'Ruta por Alcalá y Quimbaya hasta Puerto Alejandría',
      'Recorrido en balsa por el Río La Vieja',
      'Fiambre típico',
      'Incluye todo lo de la pasadía Loma Relax',
      planPrice('balsaje'),
    ],
    ctaMessage: '¡Hola! Quiero reservar la pasadía Loma Aventura de Río en Finca Hotel Loma Bonita.',
    featured: true,
  },
]
