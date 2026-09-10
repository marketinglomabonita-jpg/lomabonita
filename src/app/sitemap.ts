import type { MetadataRoute } from 'next'
import { IS_DEMO, CANONICAL_ORIGIN } from '@/core/config/site'

/** Rutas publicas indexables. Se amplia a medida que las fases agregan paginas. */
const PUBLIC_ROUTES = [
  '',
  '/hospedaje',
  '/restaurante',
  '/pasadias',
  '/experiencias',
  '/experiencias-corporativas',
  '/galeria',
  '/contacto',
  '/legal/privacidad',
  '/legal/datos-personales',
  '/legal/terminos',
  '/legal/cookies',
]

export default function sitemap(): MetadataRoute.Sitemap {
  // Demo: sin sitemap (robots ya bloquea todo).
  if (IS_DEMO) return []

  const now = new Date()
  return PUBLIC_ROUTES.map((path) => ({
    url: `${CANONICAL_ORIGIN}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }))
}
