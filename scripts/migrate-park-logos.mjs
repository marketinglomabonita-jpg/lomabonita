/**
 * Convierte los logos de los parques del Eje Cafetero (en `fotos habitaciones/`) a WebP
 * CONSERVANDO la transparencia, con slugs claros, y los AGREGA (merge, no overwrite) a
 * public/img/manifest.json. No borra ni mueve los originales (copia lógica: lee y escribe otro archivo).
 *
 * Trampa Windows: nunca escribimos el WebP sobre el mismo archivo que leemos. El único origen
 * .webp (parque-del-cafe) se lee y se escribe con OTRO nombre (logo-parque-del-cafe.webp), así que
 * no hay colisión de rutas.
 *
 *   node scripts/migrate-park-logos.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SRC = fileURLToPath(new URL('../fotos habitaciones/', import.meta.url))
const OUT = fileURLToPath(new URL('../public/img/', import.meta.url))
const MANIFEST = join(OUT, 'manifest.json')
const MAX_W = 600 // Los logos no necesitan más ancho que este.

// original -> slug de destino. Orden = orden del encargo.
const LOGOS = [
  { file: 'parque-del-cafe-logo-rojo.webp', slug: 'logo-parque-del-cafe' },
  { file: 'images.png', slug: 'logo-panaca' },
  { file: 'images (1).png', slug: 'logo-ukumari' },
  { file: 'termales-santa-rosa-de-cabal.png', slug: 'logo-termales-santa-rosa' },
  { file: 'parque los arrieros.jpg', slug: 'logo-los-arrieros' },
]

const run = async () => {
  await mkdir(OUT, { recursive: true })
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
  let total = 0

  for (const { file, slug } of LOGOS) {
    const input = join(SRC, file)
    if (!existsSync(input)) throw new Error(`No existe el logo de origen: ${file}`)
    // resize sin agrandar; sin flatten -> conserva canal alfa. WebP con alpha por defecto.
    const pipeline = sharp(input).resize({ width: MAX_W, withoutEnlargement: true })
    const meta = await pipeline.clone().metadata()
    const buf = await pipeline.clone().webp({ quality: 90 }).toBuffer()
    const out = join(OUT, `${slug}.webp`)
    if (out === input) throw new Error(`Colisión de rutas para ${slug}`)
    await writeFile(out, buf)
    const w = Math.min(meta.width ?? MAX_W, MAX_W)
    const h = meta.height && meta.width ? Math.round((meta.height * w) / meta.width) : w
    manifest[slug] = { src: `/img/${slug}.webp`, w, h, bytes: buf.length, original: file }
    total += buf.length
    console.log(`${`${slug}.webp`.padEnd(30)} ${w}x${h}  ${(buf.length / 1024).toFixed(1)} KB  (alpha: ${meta.hasAlpha})`)
  }

  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2))
  console.log(`\n${LOGOS.length} logos · ${(total / 1024).toFixed(1)} KB · manifest.json actualizado (${Object.keys(sorted).length} entradas)`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
