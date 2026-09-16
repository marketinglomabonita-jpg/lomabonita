export type Dish = {
  name: string
  description: string
  price: number
  signature?: boolean
}

/** Carta real del restaurante (precios del propietario, COP). */
export const HOUSE_DISH: Dish = {
  name: 'Plato de la Casa',
  description:
    'Nuestra versión de la bandeja paisa: el plato más abundante de la carta, con el sabor de la cocina típica de la montaña. Para llegar con hambre y salir feliz.',
  price: 30_000,
  signature: true,
}

export const DISHES: Dish[] = [
  {
    name: 'Mojarra frita',
    description: 'Crocante por fuera y jugosa por dentro, como se come a orillas del río.',
    price: 25_000,
  },
  {
    name: 'Pescado guisado',
    description: 'Pescado en salsa criolla, casero y lleno de sabor.',
    price: 25_000,
  },
  {
    name: 'Cerdo a la plancha',
    description: 'Jugoso, dorado a la plancha y en porción generosa.',
    price: 25_000,
  },
  {
    name: 'Pollo a la plancha',
    description: 'La opción ligera para disfrutar entre piscina y piscina.',
    price: 25_000,
  },
  {
    name: 'Sancocho bifásico',
    description: 'Sancocho con dos carnes, el clásico del paseo de olla colombiano.',
    price: 25_000,
  },
  {
    name: 'Fiambre',
    description: 'El almuerzo de paseo de toda la vida, envuelto en hoja de plátano.',
    price: 25_000,
  },
  {
    name: 'Chicharrón',
    description: 'Tocino carnudo y crocante, orgullo de la cocina paisa.',
    price: 25_000,
  },
]
