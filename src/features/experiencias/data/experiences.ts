export type Experience = {
  id: 'karts' | 'cabalgata' | 'balsaje'
  title: string
  tagline: string
  description: string
  details: string[]
  ctaMessage: string
  featured?: boolean
}

/**
 * Fichas de experiencias (Fase 1: informativas, sin motor de tickets).
 * El balsaje apoya su copy en la investigacion del brief:
 * balsa de guadua, ~3 h, ~12 km, Reserva del Ocaso, ruta tradicional
 * Quimbaya -> Piedras de Moler (donde esta la finca).
 */
export const EXPERIENCES: Experience[] = [
  {
    id: 'karts',
    title: 'Pista de karts',
    tagline: 'Adrenalina entre las montañas',
    description:
      'Siente la velocidad en nuestra pista de karts, un complemento perfecto para tu pasadía o tu escapada de hospedaje. Compite con tu familia o tus amigos en un ambiente campestre y seguro.',
    details: [
      'Ideal para niños, jóvenes y adultos',
      'Carrera entre amigos o vueltas de práctica',
      'Se agenda como complemento del plan pasadía',
    ],
    ctaMessage: '¡Hola! Quiero información sobre la pista de karts en Loma Bonita.',
  },
  {
    id: 'cabalgata',
    title: 'Cabalgata',
    tagline: 'A caballo por el campo cafetero',
    description:
      'Recorre a caballo los caminos de la finca y sus alrededores en Piedras de Moler, acompañado por nuestro equipo. Un plan tranquilo para conectar con el paisaje del Eje Cafetero como se hacía antes: a paso de caballo.',
    details: [
      'Paseo guiado por personal de la finca',
      'Caballos mansos, aptos para principiantes',
      'Se coordina el horario al hacer tu reserva',
    ],
    ctaMessage: '¡Hola! Quiero información sobre la cabalgata en Loma Bonita.',
  },
  {
    id: 'balsaje',
    title: 'Balsaje por el Río La Vieja',
    tagline: 'La experiencia insignia de la región',
    description:
      'Navega el Río La Vieja en una auténtica balsa de guadua, como marca la tradición de la región: unas 3 horas y ~12 km de recorrido con bogas experimentados que narran la historia del río y de sus familias. El trayecto pasa junto a la Reserva del Ocaso —110 hectáreas de bosque primario, hogar del mono aullador— y suele incluir un almuerzo campesino a mitad de camino. Mientras la mayoría de operadores sale de Quimbaya (Puerto Alejandría / Puerto Samaria) con traslado desde hoteles de Montenegro o Quimbaya, con nosotros la experiencia es con salida y regreso desde Loma Bonita: la finca está a solo 2 minutos del histórico puente de Piedras de Moler, el punto de desembarque tradicional del río.',
    details: [
      'Balsa de guadua tradicional con bogas guías',
      '~3 horas · ~12 km por el Río La Vieja',
      'Pasa junto a la Reserva del Ocaso (bosque primario, mono aullador)',
      'Almuerzo campesino a mitad de recorrido',
      'Mejor temporada: diciembre–marzo y julio–agosto (temporada seca)',
      'Salida y regreso desde Loma Bonita, sin traslados a Quimbaya',
    ],
    ctaMessage:
      '¡Hola! Quiero información sobre el balsaje por el Río La Vieja con salida y regreso desde Loma Bonita.',
    featured: true,
  },
]
