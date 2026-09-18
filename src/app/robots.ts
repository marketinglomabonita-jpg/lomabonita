import type { MetadataRoute } from 'next'
import { IS_DEMO, CANONICAL_ORIGIN, MANAGED_PATH_PREFIXES } from '@/core/config/site'

export default function robots(): MetadataRoute.Robots {
  if (IS_DEMO) {
    // Demo: nada indexable, sin sitemap.
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: MANAGED_PATH_PREFIXES.map((p) => `${p}/`),
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  }
}
