'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { Languages } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/utils'

/** Switches locale while staying on the current page, params included. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const next = locale === 'ar' ? 'en' : 'ar'

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t('switchLanguageLabel')}
      onClick={() =>
        startTransition(() => {
          // `pathname` is locale-stripped but keeps resolved params, so
          // /ar/tracks/robotics becomes /en/tracks/robotics. The query string is
          // read at click time rather than via useSearchParams, which would opt
          // every page containing the header out of static rendering.
          const query = Object.fromEntries(new URLSearchParams(window.location.search).entries())
          router.replace({ pathname, query }, { locale: next })
        })
      }
      className={cn(
        'border-border-subtle hover:bg-surface inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors disabled:opacity-60',
        className
      )}
    >
      <Languages className="size-4" aria-hidden />
      <span style={{ fontFamily: next === 'ar' ? 'var(--font-cairo)' : 'var(--font-inter)' }}>
        {t('switchLanguage')}
      </span>
    </button>
  )
}
