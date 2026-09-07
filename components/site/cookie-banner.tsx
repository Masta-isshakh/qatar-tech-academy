'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { useCookieConsent } from '@/components/providers/analytics'

export function CookieBanner() {
  const t = useTranslations('cookies')
  const { consent, setConsent } = useCookieConsent()

  if (consent !== 'unknown') return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-border-subtle bg-background p-4 shadow-lift sm:inset-x-auto sm:start-5 sm:bottom-5"
    >
      <p className="font-bold">{t('title')}</p>
      <p className="mt-1 text-sm text-muted">
        {t('body')}{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
          {t('policy')}
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => setConsent('granted')}>
          {t('accept')}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setConsent('denied')}>
          {t('reject')}
        </Button>
      </div>
    </div>
  )
}
