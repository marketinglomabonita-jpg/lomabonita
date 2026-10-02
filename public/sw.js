/**
 * Service worker mínimo de la PWA del panel (Loma Bonita).
 * Se registra con scope '/admin' desde el layout del panel: fuera de /admin
 * no controla nada y el sitio público no se ve afectado.
 *
 * Estrategia deliberadamente conservadora: network-first con la caché solo
 * como respaldo cuando no hay red — nunca sirve contenido viejo mientras
 * haya conexión, para no pisar la sesión de Supabase ni el HMR en dev.
 */
const CACHE = 'lb-panel-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const claves = await caches.keys()
      await Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Endpoints internos de Next en dev: siempre directo a red.
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.startsWith('/__next')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copia = response.clone()
          // Guardar sin romper nada si la respuesta no es cacheable (p. ej. Set-Cookie).
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(request, copia)).catch(() => {}),
          )
        }
        return response
      })
      .catch(() => caches.match(request).then((enCache) => enCache ?? Response.error())),
  )
})
