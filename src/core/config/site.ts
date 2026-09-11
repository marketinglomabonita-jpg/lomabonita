/**
 * Configuracion transversal del sitio.
 *
 * SITE_MODE controla la indexabilidad:
 *  - "demo"       -> todo el sitio va noindex, robots.txt bloquea todo, sin sitemap.
 *  - "production" -> paginas publicas indexables; solo /admin y superficies de gestion van noindex.
 *
 * El corte a produccion (fuera de alcance de este PRP) es: SITE_MODE=production + merge a main + DNS.
 */

export type SiteMode = 'demo' | 'production'

export const SITE_MODE: SiteMode =
  process.env.NEXT_PUBLIC_SITE_MODE === 'production' ? 'production' : 'demo'

export const IS_DEMO = SITE_MODE === 'demo'

/** Host canonico de PRODUCCION. Nunca la URL del demo. */
export const CANONICAL_ORIGIN = 'https://www.lomabonitahotel.com'

/** Origen real donde corre la app ahora (demo o produccion). Para enlaces absolutos internos. */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

/** Rutas de gestion: nunca indexables, nunca en el sitemap, protegidas por middleware. */
// '/mesa' (pedido del comensal) es deliberadamente PÚBLICA (se llega por QR en la
// mesa, sin login) — solo /admin y /cocina son superficies de staff.
export const MANAGED_PATH_PREFIXES = ['/admin', '/cocina'] as const

export function isManagedPath(pathname: string): boolean {
  return MANAGED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

/** Datos de negocio (NAP) — fuente unica para footer, contacto y JSON-LD. */
export const BUSINESS = {
  legalName: 'Finca Hotel Loma Bonita',
  shortName: 'Loma Bonita',
  slogan: 'Naturaleza, diversion y tranquilidad',
  // Direccion aproximada del prototipo; el propietario confirma la exacta + coordenadas del pin de Maps.
  address: {
    street: 'Piedras de Moler, Via Alcala',
    locality: 'Cartago',
    region: 'Valle del Cauca',
    country: 'CO',
  },
  // Coordenadas provisionales (prototipo). Reemplazar por el pin real de Google Maps.
  geo: { lat: 4.7123, lng: -75.8912, approximate: true },
  phones: ['+573102913182', '+573244971602'],
  whatsapp: '573102913182',
  email: null as string | null,
  hours: {
    reservas: 'Lunes a Domingo, 7:00 a.m. – 9:00 p.m.',
    pasadia: 'Ingreso desde las 9:00 a.m.',
    hospedaje: 'Check-in 3:00 p.m. · Check-out 1:00 p.m.',
  },
  social: {
    instagram: 'https://www.instagram.com/fincahotel.lomabonita/',
    facebook: 'https://www.facebook.com/share/1BZ1UQPpk8/',
    tiktok: 'https://www.tiktok.com/@fincalomabonita',
  },
  // NAP en formato de presentacion (con tildes) para footer y pagina de contacto.
  displayAddress: 'Piedras de Moler, Vía Alcalá, Cartago — Valle del Cauca, Colombia',
  // Enlaces de navegacion externa (anadidos en Fase 1: no existian en Fase 0).
  links: {
    instagramHandle: '@fincahotel.lomabonita',
    googleMaps: 'https://maps.google.com/?q=Finca+Loma+Bonita+Cartago+Piedras+de+Moler',
    waze: 'https://waze.com/ul?q=Finca+Loma+Bonita+Cartago',
  },
} as const
