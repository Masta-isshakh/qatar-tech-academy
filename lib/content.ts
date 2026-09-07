import 'server-only'

import { isAmplifyConfigured } from './amplify'
import { publicServerClient } from './amplify-server'
import { seedTracks, seedTestimonials, seedPartners, seedTestSlots } from '@/data/seed-content'
import type { CohortStatus, Level, PartnerKind } from '@/data/seed-content'
import type {
  CohortView,
  PartnerView,
  PostView,
  TestSlotView,
  TestimonialView,
  TrackView,
} from './track-types'

export * from './track-types'

/* ------------------------------------------------------------ seed fallbacks */

function seedTrackViews(): TrackView[] {
  return seedTracks.map((t) => ({
    id: t.slug,
    slug: t.slug,
    order: t.order,
    titleEn: t.titleEn,
    titleAr: t.titleAr,
    taglineEn: t.taglineEn,
    taglineAr: t.taglineAr,
    descriptionEn: t.descriptionEn,
    descriptionAr: t.descriptionAr,
    heroImageKey: t.heroImageKey,
    videoKey: t.videoKey,
    videoUrl: t.videoUrl,
    accentColor: t.accentColor,
    priceQar: t.priceQar,
    durationWeeks: t.durationWeeks,
    examVoucherIncluded: t.examVoucherIncluded,
    isComingSoon: Boolean(t.isComingSoon),
    certifications: t.certifications.map((c, i) => ({
      id: `${t.slug}-cert-${i}`,
      name: c.name,
      body: c.body,
      examPriceUsd: c.examPriceUsd,
      url: c.url,
      examOnSite: c.examOnSite ?? true,
    })),
    courses: t.courses.map((c, i) => ({
      id: `${t.slug}-course-${i}`,
      titleEn: c.titleEn,
      titleAr: c.titleAr,
      hours: c.hours,
      level: c.level,
      modules: c.modules.map((m, j) => ({ id: `${t.slug}-mod-${i}-${j}`, ...m })),
    })),
    trainers: t.trainers.map((tr, i) => ({ id: `${t.slug}-trainer-${i}`, ...tr })),
    cohorts: t.cohorts.map((c, i) => ({
      id: `${t.slug}-cohort-${i}`,
      code: c.code,
      startDate: c.startDate,
      endDate: c.endDate,
      scheduleEn: c.scheduleEn,
      scheduleAr: c.scheduleAr,
      seats: c.seats,
      seatsLeft: c.seatsLeft,
      priceQar: t.priceQar,
      status: c.status,
    })),
  }))
}

/* ------------------------------------------------------------------- helpers */

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback = 0) => (typeof v === 'number' ? v : fallback)

/**
 * Every reader below degrades to seed content instead of throwing: a transient
 * AppSync error must not take the marketing site down.
 */
async function safely<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  if (!isAmplifyConfigured) return fallback
  try {
    return await run()
  } catch (error) {
    console.error(`[content] ${label} failed, using seed content`, error)
    return fallback
  }
}

/* -------------------------------------------------------------------- tracks */

export async function getTracks(): Promise<TrackView[]> {
  const fallback = seedTrackViews()

  return safely(
    'getTracks',
    async () => {
      const { data } = await publicServerClient.models.Track.list({
        filter: { isPublished: { eq: true } },
        selectionSet: [
          'id',
          'slug',
          'order',
          'titleEn',
          'titleAr',
          'taglineEn',
          'taglineAr',
          'descriptionEn',
          'descriptionAr',
          'heroImageKey',
          'videoKey',
          'videoUrl',
          'accentColor',
          'priceQar',
          'durationWeeks',
          'examVoucherIncluded',
          'isComingSoon',
          'certifications.*',
          'cohorts.*',
        ],
        limit: 50,
      })

      if (!data?.length) return fallback

      return data
        .map((t) => ({
          id: t.id,
          slug: str(t.slug),
          order: num(t.order),
          titleEn: str(t.titleEn),
          titleAr: str(t.titleAr),
          taglineEn: str(t.taglineEn),
          taglineAr: str(t.taglineAr),
          descriptionEn: str(t.descriptionEn),
          descriptionAr: str(t.descriptionAr),
          heroImageKey: str(t.heroImageKey),
          videoKey: str(t.videoKey),
          videoUrl: str(t.videoUrl) || undefined,
          accentColor: str(t.accentColor, '#8A1538'),
          priceQar: num(t.priceQar),
          durationWeeks: num(t.durationWeeks),
          examVoucherIncluded: Boolean(t.examVoucherIncluded),
          isComingSoon: Boolean(t.isComingSoon),
          certifications: (t.certifications ?? []).map((c) => ({
            id: c.id,
            name: str(c.name),
            body: str(c.body),
            examPriceUsd: num(c.examPriceUsd),
            url: str(c.url) || undefined,
            examOnSite: c.examOnSite !== false,
          })),
          courses: [],
          trainers: [],
          cohorts: mapCohorts(t.cohorts),
        }))
        .sort((a, b) => a.order - b.order)
    },
    fallback
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCohorts(rows: any[] | undefined | null): CohortView[] {
  return (rows ?? [])
    .map((c) => ({
      id: c.id as string,
      code: str(c.code),
      startDate: str(c.startDate) || null,
      endDate: str(c.endDate) || null,
      scheduleEn: str(c.scheduleEn),
      scheduleAr: str(c.scheduleAr),
      seats: num(c.seats, 20),
      seatsLeft: num(c.seatsLeft, 0),
      priceQar: typeof c.priceQar === 'number' ? c.priceQar : null,
      status: (c.status ?? 'DRAFT') as CohortStatus,
    }))
    .filter((c) => c.status !== 'DRAFT' && c.status !== 'DONE')
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
}

export async function getTrack(slug: string): Promise<TrackView | null> {
  const fallback = seedTrackViews().find((t) => t.slug === slug) ?? null

  return safely(
    `getTrack(${slug})`,
    async () => {
      const { data } = await publicServerClient.models.Track.list({
        filter: { slug: { eq: slug }, isPublished: { eq: true } },
        selectionSet: [
          'id',
          'slug',
          'order',
          'titleEn',
          'titleAr',
          'taglineEn',
          'taglineAr',
          'descriptionEn',
          'descriptionAr',
          'heroImageKey',
          'videoKey',
          'videoUrl',
          'accentColor',
          'priceQar',
          'durationWeeks',
          'examVoucherIncluded',
          'isComingSoon',
          'certifications.*',
          'cohorts.*',
          'trainers.*',
          'courses.*',
          'courses.modules.*',
        ],
        limit: 1,
      })

      const t = data?.[0]
      if (!t) return fallback

      return {
        id: t.id,
        slug: str(t.slug),
        order: num(t.order),
        titleEn: str(t.titleEn),
        titleAr: str(t.titleAr),
        taglineEn: str(t.taglineEn),
        taglineAr: str(t.taglineAr),
        descriptionEn: str(t.descriptionEn),
        descriptionAr: str(t.descriptionAr),
        heroImageKey: str(t.heroImageKey),
        videoKey: str(t.videoKey),
        videoUrl: str(t.videoUrl) || undefined,
        accentColor: str(t.accentColor, '#8A1538'),
        priceQar: num(t.priceQar),
        durationWeeks: num(t.durationWeeks),
        examVoucherIncluded: Boolean(t.examVoucherIncluded),
        isComingSoon: Boolean(t.isComingSoon),
        certifications: (t.certifications ?? []).map((c) => ({
          id: c.id,
          name: str(c.name),
          body: str(c.body),
          examPriceUsd: num(c.examPriceUsd),
          url: str(c.url) || undefined,
          examOnSite: c.examOnSite !== false,
        })),
        courses: (t.courses ?? [])
          .map((c) => ({
            id: c.id,
            titleEn: str(c.titleEn),
            titleAr: str(c.titleAr),
            hours: num(c.hours),
            level: (c.level ?? 'BEGINNER') as Level,
            order: num(c.order),
            modules: (c.modules ?? [])
              .map((m) => ({
                id: m.id,
                titleEn: str(m.titleEn),
                titleAr: str(m.titleAr),
                labEn: str(m.labEn),
                labAr: str(m.labAr),
                hours: num(m.hours),
                order: num(m.order),
              }))
              .sort((a, b) => a.order - b.order),
          }))
          .sort((a, b) => a.order - b.order),
        trainers: (t.trainers ?? []).map((tr) => ({
          id: tr.id,
          name: str(tr.name),
          titleEn: str(tr.titleEn),
          titleAr: str(tr.titleAr),
          bioEn: str(tr.bioEn),
          bioAr: str(tr.bioAr),
          credentials: (tr.credentials ?? []).filter((c): c is string => typeof c === 'string'),
          photoKey: str(tr.photoKey),
          country: str(tr.country),
        })),
        cohorts: mapCohorts(t.cohorts),
      }
    },
    fallback
  )
}

/* -------------------------------------------------------- other public reads */

export async function getTestimonials(): Promise<TestimonialView[]> {
  const fallback = seedTestimonials.map((t, i) => ({ id: `seed-testimonial-${i}`, ...t }))

  return safely(
    'getTestimonials',
    async () => {
      const { data } = await publicServerClient.models.Testimonial.list({
        filter: { isPublished: { eq: true } },
        limit: 20,
      })
      if (!data?.length) return fallback
      return data.map((t) => ({
        id: t.id,
        name: str(t.name),
        roleEn: str(t.roleEn),
        roleAr: str(t.roleAr),
        quoteEn: str(t.quoteEn),
        quoteAr: str(t.quoteAr),
        photoKey: str(t.photoKey),
      }))
    },
    fallback
  )
}

export async function getPartners(): Promise<PartnerView[]> {
  const fallback: PartnerView[] = seedPartners.map((p, i) => ({
    id: `seed-partner-${i}`,
    name: p.name,
    kind: p.kind,
    status: 'IN_DISCUSSION',
    logoKey: '',
    url: p.url,
  }))

  return safely(
    'getPartners',
    async () => {
      const { data } = await publicServerClient.models.Partner.list({ limit: 100 })
      if (!data?.length) return fallback
      return data.map((p) => ({
        id: p.id,
        name: str(p.name),
        kind: (p.kind ?? 'MANUFACTURER') as PartnerKind,
        status: (p.status ?? 'IN_DISCUSSION') as 'IN_DISCUSSION' | 'SIGNED',
        logoKey: str(p.logoKey),
        url: str(p.url) || undefined,
      }))
    },
    fallback
  )
}

export async function getTestSlots(): Promise<TestSlotView[]> {
  const now = Date.now()
  const fallback: TestSlotView[] = seedTestSlots().map((s, i) => ({
    id: `seed-slot-${i}`,
    start: s.start,
    end: s.end,
    room: 'Exam room 1',
    capacity: s.capacity,
    booked: s.booked,
  }))

  return safely(
    'getTestSlots',
    async () => {
      const { data } = await publicServerClient.models.TestSlot.list({
        filter: { isOpen: { eq: true } },
        limit: 100,
      })
      if (!data?.length) return fallback
      return data
        .map((s) => ({
          id: s.id,
          start: str(s.start),
          end: str(s.end) || null,
          room: str(s.room) || null,
          capacity: num(s.capacity, 12),
          booked: num(s.booked),
        }))
        .filter((s) => s.start && new Date(s.start).getTime() > now)
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 20)
    },
    fallback
  ).then((slots) => slots.filter((s) => new Date(s.start).getTime() > now))
}

export async function getPosts(): Promise<PostView[]> {
  return safely(
    'getPosts',
    async () => {
      const { data } = await publicServerClient.models.Post.list({
        filter: { isPublished: { eq: true } },
        limit: 50,
      })
      return (data ?? [])
        .map(mapPost)
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    },
    []
  )
}

export async function getPost(slug: string): Promise<PostView | null> {
  return safely(
    `getPost(${slug})`,
    async () => {
      const { data } = await publicServerClient.models.Post.list({
        filter: { slug: { eq: slug }, isPublished: { eq: true } },
        limit: 1,
      })
      return data?.[0] ? mapPost(data[0]) : null
    },
    null
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(p: any): PostView {
  return {
    id: p.id,
    slug: str(p.slug),
    titleEn: str(p.titleEn),
    titleAr: str(p.titleAr),
    excerptEn: str(p.excerptEn),
    excerptAr: str(p.excerptAr),
    bodyEn: str(p.bodyEn),
    bodyAr: str(p.bodyAr),
    coverKey: str(p.coverKey),
    publishedAt: str(p.publishedAt) || null,
  }
}

export async function getAnnouncements() {
  return safely(
    'getAnnouncements',
    async () => {
      const { data } = await publicServerClient.models.Announcement.list({
        filter: { isPublished: { eq: true } },
        limit: 20,
      })
      return (data ?? [])
        .map((a) => ({
          id: a.id,
          titleEn: str(a.titleEn),
          titleAr: str(a.titleAr),
          bodyEn: str(a.bodyEn),
          bodyAr: str(a.bodyAr),
          publishedAt: str(a.publishedAt) || null,
        }))
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    },
    []
  )
}
