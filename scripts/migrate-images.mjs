/**
 * Migra las imágenes del prototipo estático a public/img/ como WebP optimizado (< 300 KB).
 * Fuente: carpeta hermana ../lomabonita-main/  (el sitio estático original).
 * Genera public/img/manifest.json  { slug: { src, w, h, bytes, original } }.
 *
 *   npm run images:migrate
 */
import { readdir, mkdir, writeFile } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SRC = fileURLToPath(new URL('../../lomabonita-main/', import.meta.url))
const OUT = fileURLToPath(new URL('../public/img/', import.meta.url))
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
  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f))
  const manifest = {}
  let total = 0

  for (const f of files) {
    const input = join(SRC, f)
    const base = sharp(input).rotate().resize({ width: MAX_W, withoutEnlargement: true })
    const meta = await base.clone().metadata()
    const { buf } = await encodeUnder(base, TARGET_KB)
    const s = `${slug(f)}.webp`
    await writeFile(join(OUT, s), buf)
    manifest[slug(f)] = {
      src: `/img/${s}`,
      w: Math.min(meta.width ?? MAX_W, MAX_W),
      h: meta.height && meta.width ? Math.round((meta.height * Math.min(meta.width, MAX_W)) / meta.width) : null,
      bytes: buf.length,
      original: f,
    }
    total += buf.length
    console.log(`${s.padEnd(48)} ${(buf.length / 1024).toFixed(0)} KB`)
  }

  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\n${files.length} imágenes · ${(total / 1024 / 1024).toFixed(1)} MB total · manifest.json escrito`)
  const overs = Object.values(manifest).filter((m) => m.bytes > TARGET_KB * 1024)
  if (overs.length) {
    console.error(`AVISO: ${overs.length} imágenes sobre ${TARGET_KB} KB`)
    process.exitCode = 1
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
