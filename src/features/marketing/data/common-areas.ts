import {
  Baby,
  Dices,
  Dumbbell,
  ParkingCircle,
  Store,
  Trophy,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react'

export type CommonArea = {
  icon: LucideIcon
  title: string
  description: string
}

/**
 * Areas comunes reales de la finca. Fuente unica: se incluyen en TODOS los
 * planes de pasadia y en CADA habitacion del hospedaje.
 */
export const COMMON_AREAS: CommonArea[] = [
  {
    icon: Waves,
    title: 'Piscina recreativa',
    description: 'Agua fresca, sol del Valle y vista a las montañas durante todo el día.',
  },
  {
    icon: Utensils,
    title: 'Zona de restaurante',
    description: 'Mesas al aire libre con vista a la piscina para comer sin afanes.',
  },
  {
    icon: Baby,
    title: 'Zona de juegos infantiles',
    description: 'Columpios y juegos para que los niños se diviertan a la vista de todos.',
  },
  {
    icon: Trophy,
    title: 'Cancha de minifútbol',
    description: 'El partido de la tarde entre familia, amigos o compañeros de trabajo.',
  },
  {
    icon: Dices,
    title: 'Salón de billar y juegos de mesa',
    description: 'Billar, rana y juegos de mesa para las horas de sombra y la noche.',
  },
  {
    icon: Dumbbell,
    title: 'Gimnasio',
    description: 'Para no perder la rutina ni en vacaciones.',
  },
  {
    icon: ParkingCircle,
    title: 'Parqueadero',
    description: 'Parqueadero privado dentro de la finca.',
  },
  {
    icon: Store,
    title: 'Tienda de mecatos',
    description: 'Bebidas, snacks y antojos a pocos pasos de la piscina.',
  },
]
