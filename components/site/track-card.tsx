import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { nextCohort, type TrackView } from '@/lib/track-types'
import { formatDate, formatPrice, pick } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MediaImage } from './media-image'
import { HoverLift } from './motion'

export type TrackCardLabels = {
  learnMore: string
  qar: string
  comingSoon: string
  nextCohort: string
  cohortTbc: string
}

/**
 * Deliberately synchronous and prop-driven so the same card renders from a
 * server page (home) and from the client-side filter on the tracks index.
 */
export function TrackCard({
  track,
  locale,
  labels,
  priority = false,
}: {
  track: TrackView
  locale: string
  labels: TrackCardLabels
  priority?: boolean
}) {
  const cohort = nextCohort(track)
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <HoverLift className="h-full">
      <Link
        href={track.isComingSoon ? '/tracks' : `/tracks/${track.slug}`}
        className="group border-border-subtle bg-background shadow-soft hover:shadow-lift flex h-full flex-col overflow-hidden rounded-2xl border transition-shadow"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <MediaImage
            src={track.heroImageKey || '/images/tracks/coming-soon.jpg'}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            accent={track.accentColor}
          />
          {track.isComingSoon ? (
            <Badge variant="onMedia" className="absolute start-3 top-3">
              {labels.comingSoon}
            </Badge>
          ) : (
            <Badge variant="onMedia" className="ltr-nums absolute start-3 top-3">
              {formatPrice(track.priceQar)} {labels.qar}
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-col gap-1.5">
            <h3 className="group-hover:text-primary text-xl">
              {pick(locale, track.titleEn, track.titleAr)}
            </h3>
            <p className="text-muted text-sm">{pick(locale, track.taglineEn, track.taglineAr)}</p>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            {!track.isComingSoon ? (
              <p className="text-muted flex items-center gap-2 text-xs">
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                <span>
                  {labels.nextCohort}:{' '}
                  <span className="text-foreground font-semibold">
                    {cohort?.startDate ? formatDate(cohort.startDate, locale) : labels.cohortTbc}
                  </span>
                </span>
              </p>
            ) : null}

            <span className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold">
              {labels.learnMore}
              <Arrow
                className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </HoverLift>
  )
}
