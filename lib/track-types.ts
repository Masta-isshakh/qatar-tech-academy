/**
 * View models and pure helpers shared by server pages and client components.
 *
 * Kept out of `lib/content.ts` because that module is `server-only`: the tracks
 * filter and the track card both run on the client.
 */
import type { CohortStatus, Level, PartnerKind } from '@/data/seed-content'

/* --------------------------------------------------------------- view models */

export type ModuleView = {
  id: string
  titleEn: string
  titleAr: string
  labEn: string
  labAr: string
  hours: number
}

export type CourseView = {
  id: string
  titleEn: string
  titleAr: string
  hours: number
  level: Level
  modules: ModuleView[]
}

export type CertificationView = {
  id: string
  name: string
  body: string
  examPriceUsd: number
  url?: string
  examOnSite: boolean
}

export type TrainerView = {
  id: string
  name: string
  titleEn: string
  titleAr: string
  bioEn: string
  bioAr: string
  credentials: string[]
  photoKey: string
  country: string
}

export type CohortView = {
  id: string
  code: string
  startDate: string | null
  endDate: string | null
  scheduleEn: string
  scheduleAr: string
  seats: number
  seatsLeft: number
  priceQar: number | null
  status: CohortStatus
}

export type TrackView = {
  id: string
  slug: string
  order: number
  titleEn: string
  titleAr: string
  taglineEn: string
  taglineAr: string
  descriptionEn: string
  descriptionAr: string
  heroImageKey: string
  videoKey: string
  videoUrl?: string
  accentColor: string
  priceQar: number
  durationWeeks: number
  examVoucherIncluded: boolean
  isComingSoon: boolean
  certifications: CertificationView[]
  courses: CourseView[]
  trainers: TrainerView[]
  cohorts: CohortView[]
}

export type TestimonialView = {
  id: string
  name: string
  roleEn: string
  roleAr: string
  quoteEn: string
  quoteAr: string
  photoKey: string
}

export type PartnerView = {
  id: string
  name: string
  kind: PartnerKind
  status: 'IN_DISCUSSION' | 'SIGNED'
  logoKey: string
  url?: string
}

export type TestSlotView = {
  id: string
  start: string
  end: string | null
  room: string | null
  capacity: number
  booked: number
}

export type PostView = {
  id: string
  slug: string
  titleEn: string
  titleAr: string
  excerptEn: string
  excerptAr: string
  bodyEn: string
  bodyAr: string
  coverKey: string
  publishedAt: string | null
}


/** First open cohort for a track, used on the cards and the sticky price card. */
export function nextCohort(track: TrackView): CohortView | null {
  const today = new Date().toISOString().slice(0, 10)
  return (
    track.cohorts
      .filter((c) => c.status === 'OPEN' && (!c.startDate || c.startDate >= today))
      .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))[0] ?? null
  )
}

export function totalHours(track: TrackView) {
  return track.courses.reduce((sum, c) => sum + (c.hours || 0), 0)
}
