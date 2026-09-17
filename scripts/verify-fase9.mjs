/**
 * Verificador de la Fase 9 (director). Comprueba por lectura de código lo que se
 * puede comprobar sin navegador; la fase D se valida además en navegador real.
 *   node scripts/verify-fase9.mjs
 */
import { readFileSync, existsSync } from 'node:fs'

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '')
const checks = []
const check = (name, ok, detail = '') => checks.push({ name, ok, detail })

const site = read('src/core/config/site.ts')
const home = read('src/app/(public)/page.tsx')
const rooms = read('src/features/hospedaje/data/rooms.ts')
const rest = read('src/app/(public)/restaurante/page.tsx')
const corp = read('src/app/(public)/experiencias-corporativas/page.tsx')
const manifest = existsSync('public/img/manifest.json')
  ? JSON.parse(read('public/img/manifest.json'))
  : {}

// Fase A — ubicación real
check('A1 lat real en site.ts', site.includes('4.710414'))
check('A2 lng real en site.ts', site.includes('-75.8561206'))
check('A3 sin coordenadas viejas', !site.includes('4.7123') && !site.includes('-75.8912'))
check('A4 enlace corto de Maps', site.includes('maps.app.goo.gl/r463QtgdDCKxHZHs6'))

// Fase B — fotos reales
const roomImgs = [...rooms.matchAll(/IMAGES\['([^']+)'\]/g)].map((m) => m[1])
const distintas = new Set(roomImgs)
check('B1 fotos de habitación registradas en el manifest', roomImgs.every((s) => manifest[s]), roomImgs.join(','))
check('B2 al menos 6 fotos distintas entre las 10 habitaciones', distintas.size >= 6, `${distintas.size} distintas`)
check('B3 ya no usa las 4 imágenes antiguas', !roomImgs.some((s) => /^habitaciones-\d-vertical$/.test(s)))
const nuevas = Object.entries(manifest).filter(([k]) => /habitacion|plato/i.test(k))
check('B4 nuevas imágenes ≤ 300 KB', nuevas.every(([, v]) => !v.bytes || v.bytes <= 300 * 1024))
check('B5 plato de la casa con foto propia', /plato/i.test(rest) && Object.keys(manifest).some((k) => /plato/i.test(k)))

// Fase C — inicio
const servicios = (home.match(/href: '\/(hospedaje|pasadias|restaurante|galeria|contacto)/g) || []).length
check('C1 5 tarjetas en "Qué te espera"', servicios === 5, `${servicios} tarjetas`)
check('C2 sin tarjeta Aventuras Loma', !home.includes('Aventuras Loma'))
// La imagen de "Nuestra esencia" se renderiza ANTES del encabezado (imagen | texto).
check('C3 "Nuestra esencia" sin la foto de la entrada', !home.includes('entrada-finca-loma-bonita'))

// Fase D — corporativo
check('D1 H1 con la marca', /Experiencias Corporativas Loma Bonita/i.test(corp))
// El botón se renderiza dentro del .map de los paquetes: en el fuente aparece una vez.
// Lo que importa es que exista y que lleve al wizard con el tipo preseleccionado.
check(
  'D2 botón Cotizar dentro del map de paquetes, con ?tipo= y #wizard',
  /Cotizar/.test(corp) && /\?tipo=\$\{tipo\.slug\}#wizard/.test(corp),
)

let fail = 0
for (const c of checks) {
  if (!c.ok) fail++
  console.log(`${c.ok ? 'OK  ' : 'MAL '} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`)
}
console.log(fail ? `\n${fail} comprobaciones fallan` : '\nTodo en verde')
process.exit(fail ? 1 : 0)
