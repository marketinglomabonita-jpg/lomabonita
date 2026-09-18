import { IMAGES, type ImageAsset } from '@/core/lib/images'

export const GALLERY_CATEGORIES = [
  { id: 'todas', label: 'Todas' },
  { id: 'zonas', label: 'Zonas y espacios' },
  { id: 'experiencias', label: 'Experiencias y visitas' },
  { id: 'gastronomia', label: 'Gastronomía' },
] as const

export type GalleryFilter = (typeof GALLERY_CATEGORIES)[number]['id']
export type GalleryCategory = Exclude<GalleryFilter, 'todas'>

export type GalleryItem = {
  image: ImageAsset
  alt: string
  caption: string
  category: GalleryCategory
}

/** Galeria migrada del prototipo (mismas fotos y captions; categorias areas->zonas, visitantes->experiencias). */
export const GALLERY_ITEMS: GalleryItem[] = [
  // Zonas y espacios
  { image: IMAGES['entrada-finca-loma-bonita'], alt: 'Entrada principal campestre a la Finca Loma Bonita', caption: 'Entrada de la Finca', category: 'zonas' },
  { image: IMAGES['loma-bonita'], alt: 'Panorámica de la Finca Loma Bonita y sus palmeras', caption: 'Panorámica Loma Bonita', category: 'zonas' },
  { image: IMAGES['piscina-hotel-la-lominta'], alt: 'Piscina del hotel Finca Loma Bonita', caption: 'Piscina del Hotel', category: 'zonas' },
  { image: IMAGES['piscina-recreativa'], alt: 'Piscina tropical con aguas cristalinas', caption: 'Piscina Recreativa', category: 'zonas' },
  { image: IMAGES['piscina-nocturna'], alt: 'Piscina iluminada de noche', caption: 'Piscina Nocturna', category: 'zonas' },
  { image: IMAGES['piscinas-2-vertical'], alt: 'Zona húmeda: vista vertical de las piscinas', caption: 'Zona Húmeda', category: 'zonas' },
  { image: IMAGES['zonas-de-comunes-de-descanso'], alt: 'Zonas comunes de descanso al aire libre', caption: 'Zonas Comunes', category: 'zonas' },
  { image: IMAGES['zona-de-amacas-descanso'], alt: 'Zona de hamacas para relajarse en la naturaleza', caption: 'Zona de Hamacas', category: 'zonas' },
  { image: IMAGES['zona-de-desanso'], alt: 'Espacios de descanso rodeados de jardines', caption: 'Zona de Descanso', category: 'zonas' },
  { image: IMAGES['zonas-de-descanso-vista-a-la-piscina-y-la-montana'], alt: 'Zonas de descanso con vista a la piscina y las montañas', caption: 'Vista a la Piscina', category: 'zonas' },
  { image: IMAGES['primera-seccion-finca-loma-bonita'], alt: 'Primera sección de la Finca con piscina tropical', caption: 'Piscina Tropical', category: 'zonas' },
  { image: IMAGES['billares-1'], alt: 'Salón de juegos con mesa de billar', caption: 'Mesa de Billar', category: 'zonas' },
  { image: IMAGES['billares-2-vertical'], alt: 'Salón de billar, vista vertical', caption: 'Salón de Billar', category: 'zonas' },
  { image: IMAGES['cancha-de-futbol'], alt: 'Cancha de fútbol en césped natural', caption: 'Cancha de Fútbol', category: 'zonas' },
  { image: IMAGES['juego-de-rana-vertical'], alt: 'Juego tradicional de rana', caption: 'Juego de Rana', category: 'zonas' },
  { image: IMAGES['zona-de-juegos-infantiles-culumbios-burrito-vertical'], alt: 'Juegos infantiles con columpios', caption: 'Juegos Infantiles', category: 'zonas' },
  { image: IMAGES['zona-infantil'], alt: 'Parque infantil y áreas de recreación para niños', caption: 'Zona Infantil', category: 'zonas' },
  { image: IMAGES['sala-de-juegos-billar-rana'], alt: 'Salón de recreación con billar y juego de rana', caption: 'Salón de Juegos', category: 'zonas' },
  { image: IMAGES['whatsapp-image-2026-05-27-at-10-28-36-am'], alt: 'Instalaciones campestres de la Finca', caption: 'Instalaciones Finca', category: 'zonas' },
  { image: IMAGES['whatsapp-image-2026-05-27-at-10-28-36-am-1'], alt: 'Vistas y jardines de Loma Bonita', caption: 'Jardines Loma Bonita', category: 'zonas' },
  // Gastronomía
  { image: IMAGES['almuerzo-pezcado-vertical'], alt: 'Almuerzo de pescado frito tradicional', caption: 'Almuerzo de Pescado', category: 'gastronomia' },
  { image: IMAGES['almuerzo-tipico-vertical'], alt: 'Almuerzo típico de la región', caption: 'Almuerzo Típico', category: 'gastronomia' },
  { image: IMAGES['desayuno-piscina-vertical'], alt: 'Desayuno servido frente a la piscina', caption: 'Desayuno en la Piscina', category: 'gastronomia' },
  { image: IMAGES['fiambre-tradicional-restaurante'], alt: 'Fiambre tradicional colombiano envuelto en hoja de plátano', caption: 'Fiambre Tradicional', category: 'gastronomia' },
  { image: IMAGES['desayno-vertical'], alt: 'Desayuno campestre completo', caption: 'Desayuno Campestre', category: 'gastronomia' },
  { image: IMAGES['desayuno-vista-a-la-piscina-y-el-paisaje'], alt: 'Desayuno campestre con vistas a la piscina y el paisaje', caption: 'Desayuno con Vista', category: 'gastronomia' },
  { image: IMAGES['restaurante-vista-a-la-piscina-vertical'], alt: 'Mesa del restaurante con vista a la piscina', caption: 'Restaurante Vista Piscina', category: 'gastronomia' },
  // Experiencias y visitas
  { image: IMAGES['pasadia-con-almuerzo-vertical'], alt: 'Visitantes disfrutando una pasadía con almuerzo', caption: 'Pasadía con Almuerzo', category: 'experiencias' },
  { image: IMAGES['visitantes-felices-finca-hotel-loma-bonita-vertical'], alt: 'Huéspedes y visitantes felices en Loma Bonita', caption: 'Visitantes Felices', category: 'experiencias' },
  { image: IMAGES['piscina-nocturna-huespedes-nadando-vertical'], alt: 'Huéspedes nadando en la piscina por la noche', caption: 'Noche de Piscina', category: 'experiencias' },
  { image: IMAGES['visitantes-pasadia'], alt: 'Visitantes disfrutando una tarde de pasadía', caption: 'Diversión en la Piscina', category: 'experiencias' },
  { image: IMAGES['vistantes-restaurante-vertical'], alt: 'Visitantes almorzando en el restaurante', caption: 'Clientes en Restaurante', category: 'experiencias' },
  { image: IMAGES['pasadia-con-fiambre-vertical'], alt: 'Grupo de amigos disfrutando una pasadía con fiambre', caption: 'Pasadía con Fiambre', category: 'experiencias' },
]
