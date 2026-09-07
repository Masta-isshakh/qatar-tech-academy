'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { nextCohort, type TrackView } from '@/lib/track-types'
import { pick } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/states'
import { TrackCard, type TrackCardLabels } from './track-card'
import { FadeUp } from './motion'

type Sort = 'order' | 'cohort' | 'price'

/**
 * Filtering runs on the client over data the page already rendered, so the
 * route stays statically generated (no `searchParams`, no per-request work).
 */
export function TracksExplorer({
  tracks,
  locale,
  labels,
}: {
  tracks: TrackView[]
  locale: string
  labels: TrackCardLabels
}) {
  const t = useTranslations('tracks')
  const [active, setActive] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('order')

  const visible = useMemo(() => {
    const filtered = active === 'all' ? tracks : tracks.filter((tr) => tr.slug === active)
    const sorted = [...filtered]

    if (sort === 'price') {
      sorted.sort((a, b) => (a.priceQar || Infinity) - (b.priceQar || Infinity))
    } else if (sort === 'cohort') {
      sorted.sort((a, b) => {
        const da = nextCohort(a)?.startDate ?? '9999'
        const db = nextCohort(b)?.startDate ?? '9999'
        return da.localeCompare(db)
      })
    } else {
      sorted.sort((a, b) => a.order - b.order)
    }
    return sorted
  }, [tracks, active, sort])

  const chips = [{ slug: 'all', title: t('filterAll') }].concat(
    tracks.map((tr) => ({ slug: tr.slug, title: pick(locale, tr.titleEn, tr.titleAr) }))
  )

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label={t('filterAll')} className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.slug}
              type="button"
              aria-pressed={active === chip.slug}
              onClick={() => setActive(chip.slug)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                active === chip.slug
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border-subtle hover:bg-surface'
              )}
            >
              {chip.title}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">{t('sortLabel')}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm font-semibold"
          >
            <option value="order">{t('sortOrder')}</option>
            <option value="cohort">{t('sortCohort')}</option>
            <option value="price">{t('sortPrice')}</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((track, i) => (
            <FadeUp as="li" key={track.id} delay={Math.min(i, 3) * 0.05} className="h-full">
              <TrackCard track={track} locale={locale} labels={labels} priority={i < 3} />
            </FadeUp>
          ))}
        </ul>
      )}
    </>
  )
}
