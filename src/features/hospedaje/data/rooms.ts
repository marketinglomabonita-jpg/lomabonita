import { IMAGES, type ImageAsset } from '@/core/lib/images'

export type Room = {
  slug: string
  name: string
  badge: string
  description: string
  amenities: string[]
  image: ImageAsset
  imageAlt: string
  /** Mensaje precargado para el CTA de cotizacion por WhatsApp. */
  ctaMessage: string
}

/** Acomodaciones del prototipo (contenido migrado de index.html). */
export const ROOMS: Room[] = [
  {
    slug: 'confort-familiar',
    name: 'Habitación Confort Familiar',
    badge: 'Popular',
    description:
      'Habitación amplia diseñada especialmente para familias. Cuenta con cómodas camas dobles e individuales, lencería premium, baño privado y una excelente ventilación con vistas a los jardines tropicales de la loma.',
    amenities: [
      'Capacidad para 4–6 personas',
      'Baño privado con ducha',
      'Televisión y ventilador',
      'Vista a la naturaleza',
    ],
    image: IMAGES['habitaciones-1-vertical'],
    imageAlt: 'Habitación Confort Familiar, amplia y campestre',
    ctaMessage:
      'Hola, estoy interesado(a) en cotizar hospedaje en la Habitación Confort Familiar.',
  },
  {
    slug: 'cabana-multiple',
    name: 'Cabaña Múltiple para Amigos',
    badge: 'Grupos',
    description:
      'Ideal para grupos que buscan una experiencia de convivencia y diversión. Excelente distribución de camas en litera e individuales con un ambiente rústico campestre que combina con el paisaje tropical.',
    amenities: [
      'Capacidad para 6–8 personas',
      'Espacio amplio para maletas',
      'Cercana a la zona de piscina y billares',
      'Baños integrados amplios',
    ],
    image: IMAGES['habitaciones-2-vertical'],
    imageAlt: 'Cabaña Múltiple con camas en litera para grupos',
    ctaMessage:
      'Hola, estoy interesado(a) en cotizar hospedaje en la Cabaña Múltiple para Amigos.',
  },
  {
    slug: 'clasica-doble',
    name: 'Habitación Clásica Doble',
    badge: 'Parejas',
    description:
      'Un refugio acogedor perfecto para parejas que desean desconectarse el fin de semana. Privacidad, comodidad y el arrullo del viento y los pájaros al amanecer.',
    amenities: [
      'Capacidad para 2 personas',
      'Cama matrimonial doble',
      'Toallas y amenities de bienvenida',
      'Desconexión y privacidad total',
    ],
    image: IMAGES['habitaciones-3-vertical'],
    imageAlt: 'Habitación Clásica Doble, acogedora para parejas',
    ctaMessage:
      'Hola, estoy interesado(a) en cotizar hospedaje en la Habitación Clásica Doble.',
  },
  {
    slug: 'suite-loma-bonita',
    name: 'Suite Loma Bonita',
    badge: 'Empresas & familias',
    description:
      'Nuestra mejor acomodación con el máximo confort de la finca. Excelente ventilación, amplias ventanas y acabados campestres ideales para directivos de empresas o escapadas familiares especiales.',
    amenities: [
      'Capacidad hasta 5 personas',
      'Cama king y auxiliares confortables',
      'Balcón privado hacia las palmeras',
      'TV por cable y baño de lujo',
    ],
    image: IMAGES['habitaciones-4-vertical'],
    imageAlt: 'Suite Loma Bonita, la acomodación más amplia de la finca',
    ctaMessage: 'Hola, estoy interesado(a) en cotizar hospedaje en la Suite Loma Bonita.',
  },
]
