import { getLocale, getTranslations } from 'next-intl/server'
import { Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { site } from '@/lib/site'
import { Logo } from './logo'

export async function SiteFooter() {
  const locale = await getLocale()
  const t = await getTranslations('footer')
  const nav = await getTranslations('nav')

  const explore = [
    { href: '/tracks', label: nav('tracks') },
    { href: '/exam-centre', label: nav('examCentre') },
    { href: '/corporate', label: nav('corporate') },
    { href: '/register', label: nav('register') },
  ] as const

  const company = [
    { href: '/about', label: nav('about') },
    { href: '/news', label: nav('news') },
    { href: '/contact', label: nav('contact') },
    { href: '/portal', label: nav('portal') },
  ] as const

  const legal = [
    { href: '/privacy', label: locale === 'ar' ? 'إشعار الخصوصية' : 'Privacy notice' },
    { href: '/terms', label: locale === 'ar' ? 'شروط الاستخدام' : 'Terms of use' },
  ] as const

  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">{t('about')}</p>
          <div className="flex items-center gap-2">
            <SocialLink href={site.social.instagram} label="Instagram">
              <Instagram className="size-4" aria-hidden />
            </SocialLink>
            <SocialLink href={site.social.linkedin} label="LinkedIn">
              <Linkedin className="size-4" aria-hidden />
            </SocialLink>
            <SocialLink href={site.social.youtube} label="YouTube">
              <Youtube className="size-4" aria-hidden />
            </SocialLink>
          </div>
        </div>

        <FooterColumn title={t('explore')} links={explore} />
        <FooterColumn title={t('company')} links={company} />

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{t('contact')}</h2>
          <a
            href={`tel:${site.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-sm hover:text-primary"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            <span className="ltr-nums">{site.phone}</span>
          </a>
          <a href={`mailto:${site.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
            <Mail className="size-4 shrink-0" aria-hidden />
            <span className="ltr-nums">{site.email}</span>
          </a>
          <p className="flex items-start gap-2 text-sm text-muted">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {locale === 'ar' ? site.addressAr : site.addressEn}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-muted hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border-subtle">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t('rights', { year: new Date().getFullYear() })}</p>
          <p>
            {t('licence', {
              value: site.licenceNumber || (locale === 'ar' ? 'قيد الإجراء' : 'in progress'),
            })}
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { href: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{title}</h2>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid size-9 place-items-center rounded-full border border-border-subtle transition-colors hover:bg-background"
    >
      {children}
    </a>
  )
}
