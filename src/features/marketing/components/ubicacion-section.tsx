import { Car, MapPin, Navigation, Plane, TreePalm } from 'lucide-react'
import { BUSINESS } from '@/core/config/site'
import { buttonVariants } from '@/core/ui/button'
import { SectionHeading } from './section-heading'

type Grupo = {
  icon: typeof MapPin
  titulo: string
  items: { nombre: string; detalle: string }[]
}

/**
 * Ubicacion y como llegar. Tiempos APROXIMADOS en carro desde la finca
 * (Piedras de Moler, via Cartago-Alcala); el pin real vive en BUSINESS.links.googleMaps.
 */
const GRUPOS: Grupo[] = [
  {
    icon: TreePalm,
    titulo: 'Parques del Eje Cafetero',
    items: [
      { nombre: 'Parque del Café', detalle: 'Montenegro · 40–45 min' },
      { nombre: 'PANACA', detalle: 'Quimbaya · 40–45 min' },
      { nombre: 'Bioparque Ukumarí', detalle: 'Vía Pereira–Cerritos · menos de 1 h' },
      { nombre: 'Río La Vieja', detalle: 'Piedras de Moler · 2 min' },
    ],
  },
  {
    icon: Car,
    titulo: 'Ciudades y pueblos',
    items: [
      { nombre: 'Cartago', detalle: 'A pocos minutos por la vía a Alcalá' },
      { nombre: 'Alcalá', detalle: 'Pueblo cafetero vecino · ~15 min' },
      { nombre: 'Pereira', detalle: '~30 km · ~40 min' },
      { nombre: 'Quimbaya', detalle: '~30 min' },
      { nombre: 'Armenia', detalle: '~56 km · poco más de 1 h' },
      { nombre: 'Filandia y Salento', detalle: 'Los pueblos más visitados · 1 a 1½ h' },
    ],
  },
  {
    icon: Plane,
    titulo: 'Aeropuertos',
    items: [
      { nombre: 'Santa Ana (Cartago)', detalle: 'El más cercano' },
      { nombre: 'Matecaña (Pereira)', detalle: '~45 min' },
      { nombre: 'El Edén (Armenia)', detalle: '~1¼ h' },
      { nombre: 'La Nubia (Manizales)', detalle: '~2 h' },
      { nombre: 'Bonilla Aragón (Cali)', detalle: '~2½ h' },
    ],
  },
]

export function UbicacionSection() {
  return (
    <section className="bg-muted/40 py-16" id="ubicacion">
      <div className="container space-y-10">
        <SectionHeading
          tag="Cómo llegar"
          title="En el corazón del Eje Cafetero"
          subtitle="Estamos en Piedras de Moler, sobre la vía Cartago–Alcalá: campo de verdad, con los planes de la región a la mano."
        />

        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center">
          <MapPin className="size-6 text-primary" aria-hidden="true" />
          <p className="font-medium text-cafe">{BUSINESS.displayAddress}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={BUSINESS.links.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'primary' })}
            >
              <Navigation className="size-4" aria-hidden="true" />
              Abrir en Google Maps
            </a>
            <a
              href={BUSINESS.links.waze}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline' })}
            >
              <Car className="size-4" aria-hidden="true" />
              Ir con Waze
            </a>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo} className="rounded-xl border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-cafe">
                <grupo.icon className="size-5 text-primary" aria-hidden="true" />
                {grupo.titulo}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {grupo.items.map((item) => (
                  <li key={item.nombre} className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{item.nombre}</span>
                    <span className="text-right text-muted-foreground">{item.detalle}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Tiempos aproximados en carro por vías pavimentadas; varían según el tráfico.
        </p>
      </div>
    </section>
  )
}
