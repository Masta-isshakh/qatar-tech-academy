/**
 * Mobile Lighthouse run against a production build.
 *
 *   npm run build && npm run start -- --port 3100
 *   node scripts/lighthouse.mjs            # writes lighthouse/*.json + a summary
 *
 * Targets (section 7 of the brief): ≥ 95 on performance, accessibility,
 * best-practices and SEO for the home page and a track page.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const BASE = process.env.LH_BASE_URL ?? 'http://127.0.0.1:3100'
const OUT = join(process.cwd(), 'lighthouse')

const PAGES = [
  { name: 'home-ar', url: `${BASE}/ar` },
  { name: 'home-en', url: `${BASE}/en` },
  { name: 'track-ar', url: `${BASE}/ar/tracks/robotics` },
  { name: 'track-en', url: `${BASE}/en/tracks/robotics` },
]

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const THRESHOLD = 95

mkdirSync(OUT, { recursive: true })

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  chromePath: process.env.CHROME_PATH,
})

const summary = []
let failed = false

try {
  for (const page of PAGES) {
    const result = await lighthouse(
      page.url,
      { port: chrome.port, output: 'json', logLevel: 'error' },
      // Default config is the mobile emulation preset.
      undefined
    )

    if (!result) throw new Error(`Lighthouse returned nothing for ${page.url}`)

    writeFileSync(join(OUT, `${page.name}.json`), result.report, 'utf8')

    const scores = Object.fromEntries(
      CATEGORIES.map((c) => [c, Math.round((result.lhr.categories[c]?.score ?? 0) * 100)])
    )
    const lcp = result.lhr.audits['largest-contentful-paint']?.numericValue ?? 0
    const cls = result.lhr.audits['cumulative-layout-shift']?.numericValue ?? 0

    const ok = CATEGORIES.every((c) => scores[c] >= THRESHOLD)
    if (!ok) failed = true

    summary.push({
      page: page.name,
      ...scores,
      lcpMs: Math.round(lcp),
      cls: Number(cls.toFixed(3)),
      pass: ok,
    })
  }
} finally {
  // On Windows Chrome can still hold its temp profile open, and chrome-launcher
  // throws EPERM trying to remove it. That must not fail the run.
  try {
    await chrome.kill()
  } catch (err) {
    console.warn('[lighthouse] chrome cleanup:', err.message)
  }
}

console.table(summary)
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8')
console.log(`\nReports written to ${OUT}`)

if (failed) {
  console.error(`\nAt least one category scored below ${THRESHOLD}.`)
  process.exit(1)
}
