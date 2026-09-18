// Verifica las imagenes IA de public/img/ai contra manifest-ai.json.
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
const SLUGS = ['ai-pista-karts','ai-balsaje-rio-la-vieja','ai-jeep-willys','ai-cascadas','ai-plato-de-la-casa','ai-cena-campestre']
const root = new URL('../public', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('../public/img/ai/manifest-ai.json', import.meta.url), 'utf8'))
let fail = 0
for (const slug of SLUGS) {
  const m = manifest[slug]
  if (!m) { console.log('FALTA en manifest', slug); fail++; continue }
  const file = new URL('.' + m.src, root + '/')
  try {
    const meta = await sharp(file.pathname.replace(/^\/([A-Z]:)/, '$1')).metadata()
    const kb = (await stat(file)).size / 1024
    const ok = meta.format === 'webp' && meta.width === m.w && meta.height === m.h &&
      m.w >= 1200 && m.w <= 1600 && m.w / m.h >= 1.3 && m.w / m.h <= 1.8 && kb >= 40 && kb <= 300
    console.log(ok ? 'OK  ' : 'MAL ', slug, meta.format, `${meta.width}x${meta.height}`, `${kb.toFixed(0)}KB`)
    if (!ok) fail++
  } catch (e) { console.log('ERROR', slug, e.message); fail++ }
}
process.exit(fail ? 1 : 0)
