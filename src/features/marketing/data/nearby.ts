export type NearbyPlace = { name: string; detail: string }

/**
 * Que hacer cerca de la finca. Distancias aproximadas y prudentes: el brief
 * midio ~40-45 min a Parque del Cafe y PANACA; Ukumari esta en el km 14 de la
 * via Pereira-Cerritos (salida hacia Cartago).
 */
export const NEARBY_PLACES: NearbyPlace[] = [
  {
    name: 'Río La Vieja y Piedras de Moler',
    detail:
      'A un par de minutos de la finca: el río que divide Valle y Quindío, punto de llegada tradicional del balsaje.',
  },
  {
    name: 'Parque del Café',
    detail: 'En Montenegro, Quindío, a unos 40–45 minutos: atracciones mecánicas, shows y cultura cafetera.',
  },
  {
    name: 'PANACA',
    detail: 'En Quimbaya, Quindío, a unos 40–45 minutos: el parque temático del campo y los animales.',
  },
  {
    name: 'Bioparque Ukumarí',
    detail: 'En la vía Pereira–Cerritos, a menos de una hora: fauna y flora de Colombia y del mundo.',
  },
  {
    name: 'Alcalá',
    detail:
      'Pueblo cafetero del norte del Valle: el Bosque del Samán, fincas de café y los caminos del balsaje.',
  },
  {
    name: 'Centro histórico de Cartago',
    detail: 'La Casa del Virrey, sus iglesias coloniales y la tradición de los bordados de Cartago.',
  },
]
