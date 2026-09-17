import type { NextConfig } from 'next'

const isDemo = process.env.NEXT_PUBLIC_SITE_MODE !== 'production'

/**
 * Content-Security-Policy.
 * Se mantiene deliberadamente estricta. Ajustar SOLO cuando una fase agregue un origen real
 * (p. ej. dominio de Supabase Storage para imagenes, o un proveedor de analitica tras consentimiento).
 */
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : ''
  } catch {
    return ''
  }
})()

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDemo ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://${supabaseHost}`,
  `font-src 'self' data:`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://www.google-analytics.com https://www.googletagmanager.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
]
  .filter(Boolean)
  .join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Demo: todo el sitio fuera de los indices hasta el corte a produccion.
  ...(isDemo ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
]

const nextConfig: NextConfig = {
  experimental: {
    mcpServer: true,
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
  // /experiencias se unifico en /pasadias (mismo contenido): 308 para no duplicar ni canibalizar.
  async redirects() {
    return [{ source: '/experiencias', destination: '/pasadias', permanent: true }]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
