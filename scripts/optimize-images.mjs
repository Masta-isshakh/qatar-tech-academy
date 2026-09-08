/**
 * Turns the raw photography in `source-images/` into the optimised files the
 * site references under `public/images/`, plus `data/image-manifest.json`.
 *
 *   npm run images
 *
 * Why this exists, and why the images are NOT put in S3:
 *
 * - The raw files are 1.6–2.6 MB PNGs. Shipping those, even through
 *   next/image, means a slow first optimisation per size and a heavy origin
 *   fetch. Pre-shrinking to the largest size the layout can show, as
 *   progressive JPEG, brings each to ~100–250 KB before next/image makes the
 *   per-breakpoint AVIF/WebP variants.
 * - Amplify Hosting already serves `public/` through CloudFront, so these are
 *   CDN-delivered with no lambda in the way. S3 objects behind the Amplify
 *   storage bucket need a signed URL from the Cognito guest role — an extra
 *   round-trip before the browser can even start the download, and no
 *   `priority` preload. S3 is the right home for videos and admin uploads,
 *   not for the hero.
 * - Every image also gets a 20px blur placeholder (inlined data URL) so the
 *   frame is painted with colour on the very first frame, before any bytes
 *   of the real image arrive.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'source-images')
const OUT = join(root, 'public')

/** source file → public path, with the largest width the layout ever renders. */
const PHOTOS = [
  // Hero slides (order matches components/site/hero-slider.tsx)
  { src: 'hero1 (3).png', out: 'images/hero/hero-1.jpg', width: 1920 }, // robotics: manufacturer trainer + learner
  { src: 'hero1 (2).png', out: 'images/hero/hero-2.jpg', width: 1920 }, // drones: caged flight
  { src: 'hero1 (1).png', out: 'images/hero/hero-3.jpg', width: 1920 }, // cyber: the SOC

  // Track cards / track heroes
  { src: 'image (2).png', out: 'images/tracks/robotics.jpg', width: 1600 },
  { src: 'image (3).png', out: 'images/tracks/networking.jpg', width: 1600 },
  { src: 'image (4).png', out: 'images/tracks/cybersecurity.jpg', width: 1600 },
  { src: 'image (5).png', out: 'images/tracks/ai.jpg', width: 1600 },
  { src: 'image (6).png', out: 'images/tracks/marketing.jpg', width: 1600 },
  { src: 'image (7).png', out: 'images/tracks/coming-soon.jpg', width: 1600 },

  // Section imagery
  { src: 'image (1).png', out: 'images/sections/workshop.jpg', width: 1600 },
  { src: 'image (10).png', out: 'images/sections/app.jpg', width: 1200 },
  { src: 'image (11).png', out: 'images/sections/corporate.jpg', width: 1600 },
  { src: 'image (13).png', out: 'images/sections/university.jpg', width: 1600 },
  { src: 'image (1).jpeg', out: 'images/sections/doha-sunrise.jpg', width: 1600 },
  { src: 'image (8).png', out: 'images/sections/exam-centre.jpg', width: 1600 },
  { src: 'image (9).png', out: 'images/sections/certifications.jpg', width: 1600 },
  { src: 'image (2).jpeg', out: 'images/sections/maker-lab.jpg', width: 1600 },
  { src: 'hero1 (3).png', out: 'images/sections/cascade.jpg', width: 1600 },
]

const LOGO_SRC = 'logo.png'

async function photo({ src, out, width }) {
  const input = join(SRC, src)
  if (!existsSync(input)) {
    console.warn(`  skip ${out}: missing source ${src}`)
    return null
  }

  const target = join(OUT, out)
  mkdirSync(dirname(target), { recursive: true })

  const image = sharp(input).rotate()
  const meta = await image.metadata()
  const finalWidth = Math.min(width, meta.width ?? width)

  const info = await image
    .clone()
    .resize({ width: finalWidth, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toFile(target)

  // 20px-wide LQIP. Small enough to inline into the HTML for every image on a
  // page without moving the needle on document size.
  const blur = await sharp(input).rotate().resize({ width: 20 }).jpeg({ quality: 50 }).toBuffer()

  console.log(`  ${out}  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`)
  return [
    `/${out}`,
    {
      width: info.width,
      height: info.height,
      blurDataURL: `data:image/jpeg;base64,${blur.toString('base64')}`,
    },
  ]
}

/**
 * The supplied logo is the dark-background version: a maroon emblem on a white
 * tile with a white wordmark. For the light header we recolour the white pixels
 * of the wordmark and divider to charcoal, leaving the emblem region untouched
 * (its white tile simply disappears on a white page).
 */
async function logos() {
  const input = join(SRC, LOGO_SRC)
  if (!existsSync(input)) {
    console.warn('  skip logo: missing source')
    return
  }
  mkdirSync(join(OUT, 'images'), { recursive: true })

  const WIDTH = 900
  const base = sharp(input).resize({ width: WIDTH }).ensureAlpha()
  const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  // Everything right of the emblem tile (~35% of the width) is wordmark + bar.
  const textStart = Math.round(width * 0.355)
  const light = Buffer.from(data)
  for (let y = 0; y < height; y++) {
    for (let x = textStart; x < width; x++) {
      const i = (y * width + x) * channels
      const [r, g, b, a] = [light[i], light[i + 1], light[i + 2], light[i + 3]]
      if (a > 0 && r > 200 && g > 200 && b > 200) {
        light[i] = 0x22
        light[i + 1] = 0x22
        light[i + 2] = 0x22
      }
    }
  }

  await sharp(light, { raw: { width, height, channels } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT, 'images/logo.png'))
  await base
    .clone()
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(OUT, 'images/logo-white.png'))

  // Favicon and touch icon: the emblem, square, transparent background.
  const emblemWidth = Math.round(width * 0.33)
  const emblem = sharp(input)
    .resize({ width: WIDTH })
    .extract({ left: 0, top: 0, width: emblemWidth, height })
  const side = Math.max(emblemWidth, height)
  const square = await emblem
    .extend({
      top: Math.floor((side - height) / 2),
      bottom: Math.ceil((side - height) / 2),
      left: Math.floor((side - emblemWidth) / 2),
      right: Math.ceil((side - emblemWidth) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp(square)
    .resize(512, 512)
    .png()
    .toFile(join(root, 'app', 'icon.png'))
  await sharp(square)
    .resize(180, 180)
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(join(root, 'app', 'apple-icon.png'))

  console.log(
    `  images/logo.png + logo-white.png  ${width}×${height}; app/icon.png, app/apple-icon.png`
  )
}

console.log('Optimising images…')
const manifest = {}
for (const entry of PHOTOS) {
  const result = await photo(entry)
  if (result) manifest[result[0]] = result[1]
}
await logos()

const manifestPath = join(root, 'data', 'image-manifest.json')
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}
writeFileSync(manifestPath, `${JSON.stringify({ ...previous, ...manifest }, null, 2)}\n`, 'utf8')
console.log(`Manifest: ${Object.keys(manifest).length} entries → data/image-manifest.json`)
