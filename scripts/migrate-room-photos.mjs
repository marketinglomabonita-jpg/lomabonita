/**
 * Convierte las fotos reales de `fotos habitaciones/` a WebP optimizado (< 300 KB, ancho <= 1500)
 * en public/img/ y las AGREGA (merge, no overwrite) a public/img/manifest.json.
 * Incluye `Plato de la casa.png`.
 *
 *   node scripts/migrate-room-photos.mjs
 */
import { readdir, mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SRC = fileURLToPath(new URL('../fotos habitaciones/', import.meta.url))
const OUT = fileURLToPath(new URL('../public/img/', import.meta.url))
const MANIFEST = join(OUT, 'manifest.json')
const MAX_W = 1500
const TARGET_KB = 290

const slug = (name) =>
  basename(name, extname(name))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

async function encodeUnder(pipeline, kb) {
  for (const q of [78, 70, 62, 54, 46, 38, 32]) {
    const buf = await pipeline.clone().webp({ quality: q }).toBuffer()
    if (buf.length <= kb * 1024 || q === 32) return { buf, q }
  }
}

const run = async () => {
  await mkdir(OUT, { recursive: true })
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f))
  let total = 0
  let added = 0

  for (const f of files) {
    const input = join(SRC, f)
    const base = sharp(input).rotate().resize({ width: MAX_W, withoutEnlargement: true })
    const meta = await base.clone().metadata()
    const { buf } = await encodeUnder(base, TARGET_KB)
    const s = slug(f)
    await writeFile(join(OUT, `${s}.webp`), buf)
    manifest[s] = {
      src: `/img/${s}.webp`,
      w: Math.min(meta.width ?? MAX_W, MAX_W),
      h: meta.height && meta.width ? Math.round((meta.height * Math.min(meta.width, MAX_W)) / meta.width) : null,
      bytes: buf.length,
      original: f,
    }
    total += buf.length
    added++
    console.log(`${`${s}.webp`.padEnd(52)} ${(buf.length / 1024).toFixed(0)} KB`)
  }

  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2))
  console.log(`\n${added} imágenes nuevas · ${(total / 1024 / 1024).toFixed(1)} MB · manifest.json actualizado (${Object.keys(sorted).length} entradas)`)
  const overs = Object.values(manifest).filter((m) => m.bytes && m.bytes > TARGET_KB * 1024)
  if (overs.length) {
    console.error(`AVISO: ${overs.length} imágenes sobre ${TARGET_KB} KB`)
    process.exitCode = 1
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
