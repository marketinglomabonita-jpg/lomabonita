import { createElement } from 'react'
import type { Metadata } from 'next'
import { BUSINESS, CANONICAL_ORIGIN } from '@/core/config/site'
import type { ImageAsset } from '@/core/lib/images'

/**
 * SEO tecnico (Fase 2): metadata por ruta + datos estructurados JSON-LD.
 * Toda URL absoluta sale de CANONICAL_ORIGIN (host de produccion) — nunca
 * de la URL del demo — y los datos de negocio salen de BUSINESS.
 */

/** URL absoluta contra el host canonico de produccion. */
export function absUrl(path: string): string {
  return `${CANONICAL_ORIGIN}${path === '/' ? '' : path}`
}

type PageSeoInput = {
  /** Titulo de pagina (sin marca salvo absoluteTitle). */
  title: string
  description: string
  /** Ruta canonica de la pagina, p. ej. '/hospedaje'. */
  path: string
  image: ImageAsset
  imageAlt: string
  /** La Home lleva titulo absoluto: no pasa por el template `%s | Loma Bonita`. */
  absoluteTitle?: boolean
  type?: 'website' | 'article'
}

/**
 * Metadata estandar por pagina: title, description, canonical (resuelto por
 * Next contra metadataBase = CANONICAL_ORIGIN), Open Graph y Twitter card.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  absoluteTitle = false,
  type = 'website',
}: PageSeoInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${BUSINESS.shortName}`
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: BUSINESS.legalName,
      locale: 'es_CO',
      type,
      images: [{ url: image.src, width: image.w, height: image.h, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.src],
    },
  }
}

/** Renderiza un objeto como bloque JSON-LD desde un server component. */
export function JsonLd({ data }: { data: object }) {
  return createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  })
}

function postalAddress() {
  return {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.address.street,
    addressLocality: BUSINESS.address.locality,
    addressRegion: BUSINESS.address.region,
    addressCountry: BUSINESS.address.country,
  }
}

function geoCoordinates() {
  return {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.geo.lat,
    longitude: BUSINESS.geo.lng,
  }
}

const AMENITIES = [
  'Piscina recreativa',
  'Restaurante campestre',
  'Hospedaje',
  'Salón de eventos',
  'Cancha de minifútbol',
  'Salón de billar y juegos de mesa',
  'Zona de juegos infantiles',
  'Gimnasio',
  'Parqueadero',
  'Tienda de mecatos',
]

const KNOWS_ABOUT = [
  'Pasadía en Cartago',
  'Finca hotel en el Eje Cafetero',
  'Balsaje por el Río La Vieja',
  'Pista de karts',
  'Cascadas',
  'Salón para eventos',
  'Parque del Café',
  'PANACA',
  'Bioparque Ukumarí',
  'Alcalá, Valle del Cauca',
]

export function lodgingBusinessJsonLd({
  image,
  description,
}: {
  image: ImageAsset
  description: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: BUSINESS.legalName,
    description,
    url: CANONICAL_ORIGIN,
    telephone: BUSINESS.phones[0],
    image: absUrl(image.src),
    address: postalAddress(),
    geo: geoCoordinates(),
    priceRange: '$$',
    sameAs: Object.values(BUSINESS.social),
    amenityFeature: AMENITIES.map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    })),
    knowsAbout: KNOWS_ABOUT,
  }
}

type PricedItem = { name: string; description: string; price: number }

export function restaurantJsonLd({
  image,
  description,
  menu = [],
}: {
  image: ImageAsset
  description: string
  menu?: ReadonlyArray<PricedItem>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: `Restaurante ${BUSINESS.shortName}`,
    description,
    servesCuisine: ['Comida típica colombiana', 'Comida paisa', 'Pescado'],
    url: absUrl('/restaurante'),
    acceptsReservations: true,
    ...(menu.length > 0 && {
      hasMenu: {
        '@type': 'Menu',
        name: 'Carta del restaurante',
        hasMenuSection: {
          '@type': 'MenuSection',
          name: 'Platos fuertes',
          hasMenuItem: menu.map((item) => ({
            '@type': 'MenuItem',
            name: item.name,
            description: item.description,
            offers: { '@type': 'Offer', price: item.price, priceCurrency: 'COP' },
          })),
        },
      },
    }),
    telephone: BUSINESS.phones[0],
    image: absUrl(image.src),
    address: postalAddress(),
    geo: geoCoordinates(),
    priceRange: '$$',
    sameAs: Object.values(BUSINESS.social),
  }
}

export function touristAttractionJsonLd({
  name,
  description,
  image,
  touristType,
  path,
}: {
  name: string
  description: string
  image: ImageAsset
  touristType: string[]
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name,
    description,
    url: absUrl(path),
    image: absUrl(image.src),
    touristType,
    location: {
      '@type': 'Place',
      name: 'Río La Vieja — Piedras de Moler',
      address: postalAddress(),
      geo: geoCoordinates(),
    },
  }
}

export function breadcrumbJsonLd(items: ReadonlyArray<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  }
}

export function faqJsonLd(items: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

/** Catalogo de ofertas con precio en COP (planes de pasadia, tarifa de hospedaje). */
export function offerCatalogJsonLd({
  name,
  path,
  offers,
}: {
  name: string
  path: string
  offers: ReadonlyArray<PricedItem>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name,
    url: absUrl(path),
    itemListElement: offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: 'COP',
      seller: { '@type': 'LodgingBusiness', name: BUSINESS.legalName, url: CANONICAL_ORIGIN },
    })),
  }
}
