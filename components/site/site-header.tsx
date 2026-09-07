'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, MessageCircle, X } from 'lucide-react'
import { Link, usePathname } from '@/i18n/routing'
import { NAV_LINKS, whatsappLink } from '@/lib/site'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { LocaleSwitcher } from './locale-switcher'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'bg-background/85 sticky top-0 z-50 border-b backdrop-blur-md transition-colors',
        scrolled ? 'border-border-subtle' : 'border-transparent'
      )}
    >
      <div className="container-site flex h-18 items-center justify-between gap-4">
        {/* No aria-label: the wordmark inside is the accessible name. */}
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'hover:text-primary-ink rounded-full px-3.5 py-2 text-[0.95rem] font-semibold transition-colors',
                  active ? 'text-primary-ink' : 'text-foreground'
                )}
              >
                {t(link.key)}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('whatsapp')}
            className="border-border-subtle hover:bg-surface hidden size-10 place-items-center rounded-full border transition-colors sm:grid"
          >
            <MessageCircle className="size-4.5" aria-hidden />
          </a>
          <ThemeToggle className="hidden sm:inline-grid" />
          <LocaleSwitcher />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/register">{t('register')}</Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t('closeMenu') : t('openMenu')}
            className="border-border-subtle grid size-10 place-items-center rounded-full border lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-border-subtle bg-background border-t lg:hidden">
          <nav aria-label="Primary mobile" className="container-site flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-border-subtle border-b py-3.5 text-base font-semibold last:border-b-0"
              >
                {t(link.key)}
              </Link>
            ))}
            <Link href="/portal" className="py-3.5 text-base font-semibold">
              {t('portal')}
            </Link>
            <div className="flex items-center gap-2 py-4">
              <ThemeToggle />
              <Button asChild size="sm" className="flex-1">
                <Link href="/register">{t('register')}</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
