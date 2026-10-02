/**
 * Manifest de la PWA del panel. Ruta dedicada (y no app/manifest.ts) para que
 * el sitio público NO se vuelva instalable: este archivo solo lo referencia
 * el layout de /admin vía metadata.manifest.
 *
 * Colores de marca medidos de globals.css: verde selva (--primary) y crema
 * de fondo (--background).
 */
export function GET() {
  const manifest = {
    name: 'Loma Bonita · Panel',
    short_name: 'LB Panel',
    description: 'Panel interno de gestión — Finca Hotel Loma Bonita',
    start_url: '/admin/calendario',
    scope: '/admin',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#1f5138',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
