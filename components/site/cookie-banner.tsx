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
    // A region, not a dialog: it does not trap focus, so role="dialog" would
    // misdescribe it to screen readers (and collide with real modals).
    <section
      role="region"
      aria-live="polite"
      aria-label={t('title')}
      className="border-border-subtle bg-background shadow-lift fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border p-4 sm:inset-x-auto sm:start-5 sm:bottom-5"
    >
      <p className="font-bold">{t('title')}</p>
      <p className="text-muted mt-1 text-sm">
        {t('body')}{' '}
        <Link href="/privacy" className="hover:text-primary-ink underline underline-offset-2">
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
    </section>
  )
}
