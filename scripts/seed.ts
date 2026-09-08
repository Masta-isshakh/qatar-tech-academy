/**
 * Seeds the Amplify Data backend from `data/seed-content.ts`.
 *
 *   npx ampx sandbox        # generates amplify_outputs.json
 *   npm run seed            # this script
 *
 * Content models are public-read but Admins-write, so the seed signs in as an
 * Admin user rather than using the API key. Provide the credentials through
 * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (`.env.local` is read automatically).
 * See README §3 for creating that user.
 *
 * Idempotent: every record is matched on a natural key (track slug, cohort
 * code, partner name…) and updated rather than duplicated, so it is safe to run
 * again after editing the seed content.
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Amplify } from 'aws-amplify'
import { signIn, signOut } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../amplify/data/resource'
import { seedPartners, seedTestSlots, seedTestimonials, seedTracks } from '../data/seed-content'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// AMPLIFY_OUTPUTS points the script at another backend's outputs file — the
// Hosting branch's, for example — without touching the sandbox's copy.
const outputsPath = process.env.AMPLIFY_OUTPUTS
  ? join(process.cwd(), process.env.AMPLIFY_OUTPUTS)
  : join(root, 'amplify_outputs.json')
const outputs = JSON.parse(readFileSync(outputsPath, 'utf8'))

if (outputs._placeholder || !outputs.data?.url) {
  console.error(
    'amplify_outputs.json is a placeholder. Run `npx ampx sandbox` (or deploy the backend) first.'
  )
  process.exit(1)
}

// Minimal .env.local loader so the credentials never have to be typed inline.
const envFile = join(root, '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, '')
  }
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    'Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (an Admins-group user). See README §3.'
  )
  process.exit(1)
}

Amplify.configure(outputs)
const client = generateClient<Schema>({ authMode: 'userPool' })

function must<T>(label: string, result: { data: T | null; errors?: unknown[] }): T {
  if (result.errors?.length || !result.data) {
    throw new Error(`${label}: ${JSON.stringify(result.errors ?? 'no data')}`)
  }
  return result.data
}

/** Upserts on a natural key so re-running never duplicates rows. */
async function upsert<T extends { id: string }>(
  label: string,
  existing: T | undefined,
  create: () => Promise<{ data: T | null; errors?: unknown[] }>,
  update: (id: string) => Promise<{ data: T | null; errors?: unknown[] }>
): Promise<T> {
  return existing ? must(label, await update(existing.id)) : must(label, await create())
}

async function main() {
  await signOut().catch(() => {})
  const { isSignedIn } = await signIn({ username: ADMIN_EMAIL!, password: ADMIN_PASSWORD! })
  if (!isSignedIn) {
    throw new Error('Sign-in did not complete (is the user confirmed and in the Admins group?)')
  }
  console.log(`Seeding ${outputs.data.url} as ${ADMIN_EMAIL}…`)

  /* ---------------------------------------------------------------- tracks */
  const { data: existingTracks } = await client.models.Track.list({ limit: 200 })

  for (const seed of seedTracks) {
    const current = existingTracks?.find((t) => t.slug === seed.slug)
    const payload = {
      slug: seed.slug,
      order: seed.order,
      titleEn: seed.titleEn,
      titleAr: seed.titleAr,
      taglineEn: seed.taglineEn,
      taglineAr: seed.taglineAr,
      descriptionEn: seed.descriptionEn,
      descriptionAr: seed.descriptionAr,
      heroImageKey: seed.heroImageKey,
      videoKey: seed.videoKey,
      videoUrl: seed.videoUrl,
      accentColor: seed.accentColor,
      priceQar: seed.priceQar,
      durationWeeks: seed.durationWeeks,
      examVoucherIncluded: seed.examVoucherIncluded,
      isComingSoon: Boolean(seed.isComingSoon),
      isPublished: true,
    }

    const track = await upsert(
      `Track ${seed.slug}`,
      current,
      () => client.models.Track.create(payload),
      (id) => client.models.Track.update({ id, ...payload })
    )
    console.log(`  track ${seed.slug}`)

    /* ------------------------------------------------------- certifications */
    const { data: certs } = await client.models.Certification.list({
      filter: { trackId: { eq: track.id } },
      limit: 100,
    })
    for (const cert of seed.certifications) {
      const existing = certs?.find((c) => c.name === cert.name)
      const body = {
        trackId: track.id,
        name: cert.name,
        body: cert.body,
        examPriceUsd: cert.examPriceUsd,
        url: cert.url,
        examOnSite: cert.examOnSite ?? true,
      }
      await upsert(
        `Certification ${cert.name}`,
        existing,
        () => client.models.Certification.create(body),
        (id) => client.models.Certification.update({ id, ...body })
      )
    }

    /* -------------------------------------------------- courses and modules */
    const { data: courses } = await client.models.Course.list({
      filter: { trackId: { eq: track.id } },
      limit: 100,
    })
    for (const [i, seedCourse] of seed.courses.entries()) {
      const existing = courses?.find((c) => c.titleEn === seedCourse.titleEn)
      const body = {
        trackId: track.id,
        order: i,
        titleEn: seedCourse.titleEn,
        titleAr: seedCourse.titleAr,
        hours: seedCourse.hours,
        level: seedCourse.level,
      }
      const course = await upsert(
        `Course ${seedCourse.titleEn}`,
        existing,
        () => client.models.Course.create(body),
        (id) => client.models.Course.update({ id, ...body })
      )

      const { data: modules } = await client.models.Module.list({
        filter: { courseId: { eq: course.id } },
        limit: 100,
      })
      for (const [j, seedModule] of seedCourse.modules.entries()) {
        const existingModule = modules?.find((m) => m.titleEn === seedModule.titleEn)
        const moduleBody = {
          courseId: course.id,
          order: j,
          titleEn: seedModule.titleEn,
          titleAr: seedModule.titleAr,
          labEn: seedModule.labEn,
          labAr: seedModule.labAr,
          hours: seedModule.hours,
        }
        await upsert(
          `Module ${seedModule.titleEn}`,
          existingModule,
          () => client.models.Module.create(moduleBody),
          (id) => client.models.Module.update({ id, ...moduleBody })
        )
      }
    }

    /* -------------------------------------------------------------- cohorts */
    const { data: cohorts } = await client.models.Cohort.list({
      filter: { trackId: { eq: track.id } },
      limit: 100,
    })
    for (const seedCohort of seed.cohorts) {
      const existing = cohorts?.find((c) => c.code === seedCohort.code)
      const body = {
        trackId: track.id,
        code: seedCohort.code,
        startDate: seedCohort.startDate,
        endDate: seedCohort.endDate,
        scheduleEn: seedCohort.scheduleEn,
        scheduleAr: seedCohort.scheduleAr,
        seats: seedCohort.seats,
        seatsLeft: seedCohort.seatsLeft,
        priceQar: seed.priceQar,
        status: seedCohort.status,
      }
      await upsert(
        `Cohort ${seedCohort.code}`,
        existing,
        () => client.models.Cohort.create(body),
        (id) => client.models.Cohort.update({ id, ...body })
      )
    }

    /* ------------------------------------------------------------- trainers */
    const { data: trainers } = await client.models.Trainer.list({
      filter: { trackId: { eq: track.id } },
      limit: 100,
    })
    for (const seedTrainer of seed.trainers) {
      const existing = trainers?.find((tr) => tr.name === seedTrainer.name)
      const body = { trackId: track.id, ...seedTrainer }
      await upsert(
        `Trainer ${seedTrainer.name}`,
        existing,
        () => client.models.Trainer.create(body),
        (id) => client.models.Trainer.update({ id, ...body })
      )
    }
  }

  /* --------------------------------------------------------- testimonials */
  const { data: testimonials } = await client.models.Testimonial.list({ limit: 100 })
  for (const seed of seedTestimonials) {
    const existing = testimonials?.find((t) => t.name === seed.name)
    await upsert(
      `Testimonial ${seed.name}`,
      existing,
      () => client.models.Testimonial.create(seed),
      (id) => client.models.Testimonial.update({ id, ...seed })
    )
  }
  console.log(`  ${seedTestimonials.length} testimonials`)

  /* -------------------------------------------------------------- partners */
  const { data: partners } = await client.models.Partner.list({ limit: 200 })
  for (const seed of seedPartners) {
    const existing = partners?.find((p) => p.name === seed.name)
    const body = {
      name: seed.name,
      kind: seed.kind,
      url: seed.url,
      status: 'IN_DISCUSSION' as const,
    }
    await upsert(
      `Partner ${seed.name}`,
      existing,
      () => client.models.Partner.create(body),
      (id) => client.models.Partner.update({ id, ...body })
    )
  }
  console.log(`  ${seedPartners.length} partners`)

  /* ------------------------------------------------------------ test slots */
  const { data: slots } = await client.models.TestSlot.list({ limit: 200 })
  for (const seed of seedTestSlots()) {
    if (slots?.some((s) => s.start === seed.start)) continue
    must(
      `TestSlot ${seed.start}`,
      await client.models.TestSlot.create({
        start: seed.start,
        end: seed.end,
        room: 'Exam room 1',
        capacity: seed.capacity,
        booked: seed.booked,
        isOpen: true,
      })
    )
  }
  console.log('  10 test slots')

  console.log('Done.')
  await signOut()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
