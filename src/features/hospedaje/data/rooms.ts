import { IMAGES, type ImageAsset } from '@/core/lib/images'

/** Tarifa por persona por noche (COP), con desayuno y cena incluidos. */
export const PERSON_RATE = 125_000
export const COUPLE_RATE = PERSON_RATE * 2
/** Los niños menores de esta edad no pagan; desde esta edad pagan tarifa completa. */
export const FREE_CHILD_AGE = 5

export type BedSet = { doubles: number; singles: number; king?: boolean }

export type Room = {
  number: number
  slug: string
  name: string
  badge: string
  idealFor: string
  description: string
  beds: BedSet
  image: ImageAsset
  imageAlt: string
}

/** Personas que caben segun la distribucion de camas (doble/matrimonial = 2). */
export function roomCapacity({ doubles, singles, king }: BedSet): number {
  return doubles * 2 + singles + (king ? 2 : 0)
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** "3 camas dobles · 4 camas sencillas" / "Cama matrimonial" */
export function describeBeds({ doubles, singles, king }: BedSet): string[] {
  const parts: string[] = []
  if (king) parts.push('Cama matrimonial')
  if (doubles) parts.push(plural(doubles, 'cama doble', 'camas dobles'))
  if (singles) parts.push(plural(singles, 'cama sencilla', 'camas sencillas'))
  return parts
}

export function roomWhatsAppMessage(room: Room): string {
  return `¡Hola! Quiero consultar disponibilidad de la ${room.name} (Habitación ${room.number}) en Finca Hotel Loma Bonita. Fechas: ___ · Adultos: ___ · Niños (edades): ___`
}

/** Las 10 habitaciones reales de la finca (distribucion de camas del propietario). */
export const ROOMS: Room[] = [
  {
    number: 1,
    slug: 'habitacion-1',
    name: 'Gran Familiar La Loma',
    badge: 'Hasta 10 personas',
    idealFor: 'Familias extensas y grupos de amigos',
    description:
      'La más amplia de la finca, pensada para que toda la familia llegue junta y nadie se quede por fuera del plan. Tres camas dobles y cuatro sencillas: abuelos, papás, primos y amigos bajo el mismo techo, con la piscina y todas las áreas comunes incluidas.',
    beds: { doubles: 3, singles: 4 },
    image: IMAGES['habitaciones-fincahotellomabonita-12'],
    imageAlt: 'Habitación familiar grande con varias camas en Finca Hotel Loma Bonita',
  },
  {
    number: 2,
    slug: 'habitacion-2',
    name: 'Gran Familiar Río La Vieja',
    badge: 'Hasta 10 personas',
    idealFor: 'Paseos familiares, integraciones y excursiones',
    description:
      'Gemela de la Gran Familiar La Loma y perfecta para reservar juntas cuando vienen dos familias o un grupo grande. Espacio de sobra para descansar después del balsaje, del partido de minifútbol o de una tarde entera en la piscina.',
    beds: { doubles: 3, singles: 4 },
    image: IMAGES['habitaciones-fincahotellomabonita-13'],
    imageAlt: 'Habitación para grupos grandes con camas dobles y sencillas',
  },
  {
    number: 3,
    slug: 'habitacion-3',
    name: 'Familiar Guadua',
    badge: 'Hasta 3 personas',
    idealFor: 'Papá, mamá y un hijo · o tres amigos',
    description:
      'Una cama doble y una sencilla para la familia pequeña que quiere un fin de semana en el campo: desayuno y cena incluidos, piscina todo el día y noches tranquilas en la vía a Alcalá.',
    beds: { doubles: 1, singles: 1 },
    image: IMAGES['habitaciones-fincahotellomabonita-1'],
    imageAlt: 'Habitación familiar con cama doble y cama sencilla',
  },
  {
    number: 4,
    slug: 'habitacion-4',
    name: 'Familiar Cafetal',
    badge: 'Hasta 5 personas',
    idealFor: 'Familias con varios niños',
    description:
      'Una cama doble y tres sencillas: cada niño con su cama y los papás con su espacio. Ideal para quienes vienen a recorrer el Eje Cafetero y quieren una base cómoda cerca de Parque del Café, PANACA y Ukumarí.',
    beds: { doubles: 1, singles: 3 },
    image: IMAGES['habitaciones-fincahotellomabonita-14'],
    imageAlt: 'Habitación con cama doble y tres camas sencillas',
  },
  {
    number: 5,
    slug: 'habitacion-5',
    name: 'Familiar Piedras de Moler',
    badge: 'Hasta 4 personas',
    idealFor: 'Familias de cuatro',
    description:
      'Una cama doble y dos sencillas: la medida justa para la familia de cuatro. Lleva el nombre de nuestra vereda, junto al histórico puente de Piedras de Moler sobre el Río La Vieja.',
    beds: { doubles: 1, singles: 2 },
    image: IMAGES['habitaciones-fincahotellomabonita-20'],
    imageAlt: 'Habitación para cuatro personas con cama doble y dos sencillas',
  },
  {
    number: 6,
    slug: 'habitacion-6',
    name: 'Matrimonial Atardecer',
    badge: 'Parejas',
    idealFor: 'Escapadas románticas y lunas de miel',
    description:
      'Cama matrimonial para dos y nada más que hacer que descansar. Un refugio para parejas que buscan silencio, aire puro y atardeceres de montaña a pocos minutos de Cartago.',
    beds: { doubles: 0, singles: 0, king: true },
    image: IMAGES['habitaciones-fincahotellomabonita-27'],
    imageAlt: 'Habitación matrimonial para parejas',
  },
  {
    number: 7,
    slug: 'habitacion-7',
    name: 'Matrimonial Palmeras',
    badge: 'Parejas',
    idealFor: 'Aniversarios y fines de semana en pareja',
    description:
      'Cama matrimonial y el sonido del campo como fondo. Suma el plato de la casa en el restaurante o el balsaje por el Río La Vieja y convierte la noche en un plan completo para dos.',
    beds: { doubles: 0, singles: 0, king: true },
    image: IMAGES['habitaciones-fincahotellomabonita-18'],
    imageAlt: 'Habitación matrimonial acogedora en la finca',
  },
  {
    number: 8,
    slug: 'habitacion-8',
    name: 'Familiar Mirador',
    badge: 'Hasta 3 personas',
    idealFor: 'Parejas con un hijo',
    description:
      'Una cama doble y una sencilla para el viaje en familia sin complicaciones: llegas, dejas las maletas y el resto del día es piscina, juegos infantiles y buena comida.',
    beds: { doubles: 1, singles: 1 },
    image: IMAGES['habitaciones-fincahotellomabonita-3'],
    imageAlt: 'Habitación con cama doble y cama sencilla para tres personas',
  },
  {
    number: 9,
    slug: 'habitacion-9',
    name: 'Familiar Alcalá',
    badge: 'Hasta 5 personas',
    idealFor: 'Grupos de amigos y familias numerosas',
    description:
      'Una cama doble y tres sencillas para el parche completo. Buena base para salir a las cascadas, al Bosque del Samán en Alcalá o a los parques temáticos, y volver a descansar a la finca.',
    beds: { doubles: 1, singles: 3 },
    image: IMAGES['habitaciones-fincahotellomabonita-15'],
    imageAlt: 'Habitación para cinco personas en Finca Hotel Loma Bonita',
  },
  {
    number: 10,
    slug: 'habitacion-10',
    name: 'Familiar Cartago',
    badge: 'Hasta 3 personas',
    idealFor: 'Viajeros de paso y familias pequeñas',
    description:
      'Una cama doble y una sencilla, perfecta para quien pasa por el norte del Valle y quiere dormir en el campo en vez de en la ciudad, con Cartago a pocos minutos por la vía a Alcalá.',
    beds: { doubles: 1, singles: 1 },
    image: IMAGES['habitaciones-fincahotellomabonita-4'],
    imageAlt: 'Habitación campestre para tres personas cerca de Cartago',
  },
]

export const TOTAL_CAPACITY = ROOMS.reduce((sum, r) => sum + roomCapacity(r.beds), 0)
