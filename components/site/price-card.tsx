'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, Clock, MessageCircle, XCircle } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { whatsappLink } from '@/lib/site'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/components/providers/analytics'
import type { CohortView } from '@/lib/track-types'
import { CohortTable } from './cohort-table'

export function PriceCard({
  trackTitle,
  trackSlug,
  priceQar,
  durationWeeks,
  examVoucherIncluded,
  cohorts,
  locale,
}: {
  trackTitle: string
  trackSlug: string
  priceQar: number
  durationWeeks: number
  examVoucherIncluded: boolean
  cohorts: CohortView[]
  locale: string
}) {
  const t = useTranslations('track')
  const tc = useTranslations('common')

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-background p-6 shadow-soft">
      <div>
        <p className="text-sm text-muted">{tc('price')}</p>
        <p className="ltr-nums text-3xl font-extrabold text-primary">
          {formatPrice(priceQar)}{' '}
          <span className="text-base font-bold text-foreground">{tc('qar')}</span>
        </p>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted">
        <Clock className="size-4 shrink-0" aria-hidden />
        <span className="ltr-nums">{durationWeeks}</span> {tc('weeks')}
      </p>

      <p className="flex items-start gap-2 text-sm">
        {examVoucherIncluded ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <XCircle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
        )}
        {examVoucherIncluded ? t('voucherIncluded') : t('voucherNotIncluded')}
      </p>

      <div className="border-t border-border-subtle pt-4">
        <h3 className="mb-2 text-sm font-bold">{t('cohorts')}</h3>
        <CohortTable cohorts={cohorts} locale={locale} compact />
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild size="lg">
          <Link
            href={{ pathname: '/register', query: { track: trackSlug } }}
            onClick={() => trackEvent('register_click', { track: trackSlug })}
          >
            {t('registerCta')}
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <a
            href={whatsappLink(t('whatsappMessage', { track: trackTitle }))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('whatsapp_click', { placement: 'track', track: trackSlug })}
          >
            <MessageCircle className="size-5" aria-hidden />
            {t('whatsappCta')}
          </a>
        </Button>
      </div>
    </div>
  )
}
