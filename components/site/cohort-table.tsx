'use client'

import { useTranslations } from 'next-intl'
import type { CohortView } from '@/lib/track-types'
import { formatDate, pick } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function CohortTable({
  cohorts,
  locale,
  compact = false,
}: {
  cohorts: CohortView[]
  locale: string
  compact?: boolean
}) {
  const t = useTranslations('track')
  const tc = useTranslations('common')

  if (cohorts.length === 0) {
    return <p className="text-sm text-muted">{t('noCohorts')}</p>
  }

  if (compact) {
    return (
      <ul className="flex flex-col gap-2">
        {cohorts.slice(0, 3).map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold">{formatDate(c.startDate, locale)}</span>
            <span className="ltr-nums text-muted">
              {c.seatsLeft} {tc('seatsLeft')}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-subtle">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead className="bg-surface text-start">
          <tr>
            <Th>{t('cohortCode')}</Th>
            <Th>{t('startDate')}</Th>
            <Th>{t('endDate')}</Th>
            <Th>{t('schedule')}</Th>
            <Th>{tc('seatsLeft')}</Th>
            <Th>{t('status')}</Th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.id} className="border-t border-border-subtle">
              <Td className="font-semibold ltr-nums">{c.code}</Td>
              <Td>{formatDate(c.startDate, locale)}</Td>
              <Td>{formatDate(c.endDate, locale)}</Td>
              <Td>{pick(locale, c.scheduleEn, c.scheduleAr)}</Td>
              <Td className="ltr-nums">
                {c.seatsLeft} / {c.seats}
              </Td>
              <Td>
                <Badge variant={c.status === 'OPEN' ? 'success' : 'neutral'}>
                  {t(`cohortStatus.${c.status}`)}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th scope="col" className="px-4 py-3 text-start font-bold">{children}</th>
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>
}
