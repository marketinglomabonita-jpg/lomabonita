import { IMAGES, type ImageAsset } from '@/core/lib/images'

/**
 * Parques del Eje Cafetero para los que Loma Bonita gestiona pasaportes.
 * Contenido literal del dueño (copy del encargo): no se inventan precios ni condiciones.
 * Los logos son marcas de terceros: se usan solo como identificación del parque.
 */
export type Park = {
  id: string
  /** Nombre completo tal como aparece en el copy del dueño. */
  name: string
  emoji: string
  logo: ImageAsset
  logoAlt: string
  /** Bajada corta bajo el nombre (parte del copy). */
  tagline?: string
  /** Párrafos descriptivos, del copy del dueño. */
  paragraphs: readonly string[]
  /** Línea "¿Buscas?" del copy, para SEO on-page. */
  searchTerms: string
  /** Mensaje de WhatsApp propio del parque (distinto por parque). */
  waMessage: string
}

export const PARKS: readonly Park[] = [
  {
    id: 'parque-del-cafe',
    name: 'Parque del Café',
    emoji: '☕',
    logo: IMAGES['logo-parque-del-cafe'],
    logoAlt: 'Logo del Parque del Café',
    paragraphs: [
      'Descubre la cultura cafetera combinada con atracciones mecánicas, paisajes, arquitectura, gastronomía y entretenimiento para toda la familia.',
      'El Parque del Café actualmente ofrece diferentes categorías de pasaporte según edad y estatura. Su Pasaporte Múltiple incluye acceso ilimitado a atracciones mecánicas y atractivos culturales, mientras que existen opciones Junior y Senior.',
    ],
    searchTerms:
      'Pasaporte Parque del Café · Precio Parque del Café · Entradas Parque del Café · Parque del Café Eje Cafetero',
    waMessage:
      '¡Hola! Quiero comprar un pasaporte para el Parque del Café desde Loma Bonita. ¿Qué categorías y disponibilidad tienen?',
  },
  {
    id: 'panaca',
    name: 'PANACA',
    emoji: '🐄',
    logo: IMAGES['logo-panaca'],
    logoAlt: 'Logo de PANACA',
    tagline: 'Vive el campo en familia',
    paragraphs: [
      'PANACA combina naturaleza, animales, cultura campesina, estaciones temáticas, talleres y presentaciones en vivo.',
      'Actualmente ofrece el Pasaporte PANACA, el Pasaporte Campo y el Pasaporte Travesía, con diferentes modalidades de visita.',
    ],
    searchTerms:
      'Pasaporte PANACA · Precio PANACA · Entradas PANACA · PANACA Quimbaya · PANACA Eje Cafetero',
    waMessage:
      '¡Hola! Quiero comprar un pasaporte para PANACA desde Loma Bonita. ¿Qué modalidades y disponibilidad tienen?',
  },
  {
    id: 'ukumari',
    name: 'Bioparque Ukumarí',
    emoji: '🦁',
    logo: IMAGES['logo-ukumari'],
    logoAlt: 'Logo del Bioparque Ukumarí',
    tagline: 'Naturaleza, fauna y conservación en Pereira',
    paragraphs: [
      'El Bioparque Ukumarí es una alternativa para quienes quieren conocer especies animales y acercarse a iniciativas de conservación durante su recorrido por el Eje Cafetero.',
      'Actualmente cuenta con tarifas diferenciadas para niños, adultos y mayores, y los menores de 2 años ingresan gratis.',
    ],
    searchTerms:
      'Pasaporte Ukumarí · Entrada Ukumarí · Precio Ukumarí · Bioparque Ukumarí Pereira',
    waMessage:
      '¡Hola! Quiero comprar una entrada para el Bioparque Ukumarí desde Loma Bonita. ¿Qué opciones y disponibilidad tienen?',
  },
  {
    id: 'termales-santa-rosa',
    name: 'Termales de Santa Rosa de Cabal',
    emoji: '♨️',
    logo: IMAGES['logo-termales-santa-rosa'],
    logoAlt: 'Logo de los Termales de Santa Rosa de Cabal',
    tagline: 'Un día de naturaleza y aguas termales',
    paragraphs: [
      'Los Termales de Santa Rosa de Cabal son una de las alternativas de bienestar y naturaleza más conocidas de Risaralda.',
      'El complejo ofrece diferentes modalidades de pasaporte, incluyendo opciones con acceso a piscinas termales, cascada Santa Helena y modalidades que incorporan alimentación u otros servicios.',
    ],
    searchTerms:
      'Termales Santa Rosa de Cabal · Pasadía Termales Santa Rosa · Pasaporte Termales · Precio Termales Santa Rosa',
    waMessage:
      '¡Hola! Quiero comprar un pasaporte para los Termales de Santa Rosa de Cabal desde Loma Bonita. ¿Qué modalidades y disponibilidad tienen?',
  },
  {
    id: 'los-arrieros',
    name: 'Parque Los Arrieros',
    emoji: '🐴',
    logo: IMAGES['logo-los-arrieros'],
    logoAlt: 'Logo del Parque Los Arrieros',
    tagline: 'Cultura, tradición y diversión en el Quindío',
    paragraphs: [
      'En el Parque Los Arrieros puedes conocer diferentes expresiones de la cultura campesina y arriera a través de presentaciones artísticas y actividades interactivas.',
      'Su pasaporte incluye el ingreso al parque, presentaciones artísticas y actividades interactivas, con un recorrido aproximado de seis horas.',
    ],
    searchTerms:
      'Pasaporte Los Arrieros · Precio Parque Los Arrieros · Entradas Los Arrieros · Parque Los Arrieros Quimbaya',
    waMessage:
      '¡Hola! Quiero comprar un pasaporte para el Parque Los Arrieros desde Loma Bonita. ¿Qué opciones y disponibilidad tienen?',
  },
] as const

/** Preguntas frecuentes del dueño (copy literal). */
export const DESTINOS_FAQS = [
  {
    question: '¿Dónde comprar pasaportes para el Parque del Café?',
    answer:
      'En Loma Bonita puedes consultar y adquirir los pasaportes que tengamos disponibles para el Parque del Café.',
  },
  {
    question: '¿Dónde comprar pasaportes para PANACA?',
    answer:
      'Puedes consultar en Loma Bonita la disponibilidad de pasaportes para PANACA y organizar tu visita desde nuestro punto de atención.',
  },
  {
    question: '¿Puedo comprar entradas para Ukumarí?',
    answer:
      'Sí, puedes consultar con nuestro equipo las opciones disponibles para visitar el Bioparque Ukumarí.',
  },
  {
    question: '¿Venden pasaportes para los Termales de Santa Rosa?',
    answer:
      'Puedes consultar las opciones disponibles para Termales Santa Rosa de Cabal y elegir la alternativa que mejor se adapte a tu visita.',
  },
  {
    question: '¿Venden entradas para Parque Los Arrieros?',
    answer:
      'Puedes consultar la disponibilidad de pasaportes para Parque Los Arrieros y planificar tu recorrido desde Loma Bonita.',
  },
  {
    question: '¿Puedo hospedarme en Loma Bonita y visitar varios parques?',
    answer:
      'Sí. La ubicación de Loma Bonita permite utilizar la finca como punto de alojamiento mientras recorres diferentes atractivos del Eje Cafetero.',
  },
] as const
