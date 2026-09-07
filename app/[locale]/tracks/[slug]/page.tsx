import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Clock, GraduationCap } from 'lucide-react'

import { routing } from '@/i18n/routing'
import { getTrack, getTracks, totalHours } from '@/lib/content'
import { pick } from '@/lib/utils'
import { LAB_GALLERY } from '@/data/seed-content'

import { Section, SectionHeader } from '@/components/site/section'
import { MediaImage } from '@/components/site/media-image'
import { VideoPlayer } from '@/components/site/video-player'
import { PriceCard } from '@/components/site/price-card'
import { CohortTable } from '@/components/site/cohort-table'
import { TrackCard } from '@/components/site/track-card'
import { FaqAccordion, type FaqItem } from '@/components/site/faq-accordion'
import { CertificationBadge, LabGallery, TrainerCard } from '@/components/site/blocks'
import { FadeUp } from '@/components/site/motion'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/states'
import { JsonLd, courseJsonLd } from '@/components/site/json-ld'

export const revalidate = 300

export async function generateStaticParams() {
  const tracks = await getTracks()
  return routing.locales.flatMap((locale) =>
    tracks.filter((t) => !t.isComingSoon).map((t) => ({ locale, slug: t.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const track = await getTrack(slug)
  if (!track) return {}

  const title = pick(locale, track.titleEn, track.titleAr)
  const description = pick(locale, track.taglineEn, track.taglineAr)

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/tracks/${slug}`,
      languages: { ar: `/ar/tracks/${slug}`, en: `/en/tracks/${slug}` },
    },
    openGraph: { title, description, type: 'article' },
  }
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const track = await getTrack(slug)
  if (!track) notFound()

  const t = await getTranslations('track')
  const tc = await getTranslations('common')
  const th = await getTranslations('home.tracks')
  const thome = await getTranslations('home')

  const allTracks = await getTracks()
  const related = allTracks.filter((x) => x.slug !== slug && !x.isComingSoon).slice(0, 3)
  const title = pick(locale, track.titleEn, track.titleAr)
  const tagline = pick(locale, track.taglineEn, track.taglineAr)
  const description = pick(locale, track.descriptionEn, track.descriptionAr)
  const hours = totalHours(track)
  const faqItems = (thome.raw('faq.items') as FaqItem[]).slice(0, 5)

  const cardLabels = {
    learnMore: tc('learnMore'),
    qar: tc('qar'),
    comingSoon: tc('comingSoon'),
    nextCohort: th('nextCohort'),
    cohortTbc: th('cohortTbc'),
  }

  if (track.isComingSoon) {
    return (
      <Section>
        <EmptyState title={t('comingSoonTitle')} body={t('comingSoonBody')} />
      </Section>
    )
  }

  return (
    <>
      <JsonLd
        data={courseJsonLd({
          locale,
          name: title,
          description: description || tagline,
          slug,
          priceQar: track.priceQar,
          durationWeeks: track.durationWeeks,
        })}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-charcoal">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[34rem]">
          {track.videoKey ? (
            <VideoPlayer
              storageKey={track.videoKey}
              poster={track.heroImageKey}
              posterAlt=""
              accent={track.accentColor}
              autoPlayMuted
              className="absolute inset-0 h-full w-full rounded-none"
            />
          ) : (
            <MediaImage
              src={track.heroImageKey}
              alt=""
              fill
              priority
              sizes="100vw"
              quality={80}
              className="object-cover"
              accent={track.accentColor}
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/65 to-charcoal/15"
          />
          <div className="container-site pointer-events-none relative flex h-full flex-col justify-end pb-10">
            <div className="max-w-3xl text-white">
              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">{title}</h1>
              <p className="mt-3 text-lg text-white/85">{tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="onMedia" className="ltr-nums">
                  <Clock className="size-3.5" aria-hidden />
                  {track.durationWeeks} {tc('weeks')}
                </Badge>
                {hours > 0 ? (
                  <Badge variant="onMedia" className="ltr-nums">
                    <GraduationCap className="size-3.5" aria-hidden />
                    {t('totalHours', { hours })}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-site grid gap-10 py-14 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <div className="flex flex-col gap-14">
          {description ? (
            <FadeUp>
              <p className="text-lg leading-relaxed text-muted">{description}</p>
            </FadeUp>
          ) : null}

          {/* What you build */}
          {track.courses.length > 0 ? (
            <section>
              <h2 className="mb-6 text-2xl md:text-3xl">{t('whatYouBuild')}</h2>
              <div className="flex flex-col gap-8">
                {track.courses.map((course) => (
                  <div key={course.id}>
                    <div className="mb-3 flex flex-wrap items-baseline gap-3">
                      <h3 className="text-xl">{pick(locale, course.titleEn, course.titleAr)}</h3>
                      <span className="ltr-nums text-sm text-muted">
                        {course.hours} {tc('hours')}
                      </span>
                    </div>
                    <ol className="flex flex-col gap-3">
                      {course.modules.map((m) => (
                        <li
                          key={m.id}
                          className="rounded-2xl border border-border-subtle bg-background p-5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h4 className="font-bold">{pick(locale, m.titleEn, m.titleAr)}</h4>
                            <span className="ltr-nums text-xs text-muted">
                              {m.hours} {tc('hours')}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-muted">
                            <span className="font-semibold text-primary">{t('lab')}: </span>
                            {pick(locale, m.labEn, m.labAr)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Certifications */}
          {track.certifications.length > 0 ? (
            <section>
              <h2 className="mb-6 text-2xl md:text-3xl">{t('certifications')}</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {track.certifications.map((c) => (
                  <li key={c.id}>
                    <CertificationBadge
                      name={c.name}
                      body={c.body}
                      examPriceUsd={c.examPriceUsd}
                      examOnSite={c.examOnSite}
                      onSiteLabel={t('examOnSite')}
                      priceLabel={t('examPrice')}
                      usdLabel={tc('usd')}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Trainers */}
          <section>
            <h2 className="mb-6 text-2xl md:text-3xl">{t('trainers')}</h2>
            {track.trainers.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {track.trainers.map((tr) => (
                  <li key={tr.id}>
                    <TrainerCard
                      name={tr.name}
                      title={pick(locale, tr.titleEn, tr.titleAr)}
                      bio={pick(locale, tr.bioEn, tr.bioAr)}
                      credentials={tr.credentials}
                      photoKey={tr.photoKey}
                      country={tr.country}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('trainersEmpty')} />
            )}
          </section>

          {/* Schedule */}
          <section>
            <h2 className="mb-6 text-2xl md:text-3xl">{t('cohorts')}</h2>
            <CohortTable cohorts={track.cohorts} locale={locale} />
          </section>

          {/* Gallery */}
          <section>
            <h2 className="mb-6 text-2xl md:text-3xl">{t('gallery')}</h2>
            <LabGallery
              items={LAB_GALLERY.slice(0, 4)}
              captions={(thome.raw('labs.captions') as string[]).slice(0, 4)}
            />
          </section>

          {/* FAQ */}
          <section>
            <h2 className="mb-6 text-2xl md:text-3xl">{t('faq')}</h2>
            <FaqAccordion items={faqItems} idPrefix={`track-${slug}`} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PriceCard
            trackTitle={title}
            trackSlug={track.slug}
            priceQar={track.priceQar}
            durationWeeks={track.durationWeeks}
            examVoucherIncluded={track.examVoucherIncluded}
            cohorts={track.cohorts}
            locale={locale}
          />
        </aside>
      </div>

      {related.length > 0 ? (
        <Section tone="surface">
          <SectionHeader title={t('related')} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <TrackCard track={r} locale={locale} labels={cardLabels} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  )
}
