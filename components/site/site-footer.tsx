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
    <footer className="border-border-subtle bg-surface border-t">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo />
          <span className="sr-only">{locale === 'ar' ? site.nameAr : site.nameEn}</span>
          <p className="text-muted max-w-xs text-sm">{t('about')}</p>
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
          <h2 className="text-muted text-sm font-bold tracking-wider uppercase">{t('contact')}</h2>
          <a
            href={`tel:${site.phone.replace(/\s/g, '')}`}
            className="hover:text-primary-ink flex items-center gap-2 text-sm"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            <span className="ltr-nums">{site.phone}</span>
          </a>
          <a
            href={`mailto:${site.email}`}
            className="hover:text-primary-ink flex items-center gap-2 text-sm"
          >
            <Mail className="size-4 shrink-0" aria-hidden />
            <span className="ltr-nums">{site.email}</span>
          </a>
          <p className="text-muted flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {locale === 'ar' ? site.addressAr : site.addressEn}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted hover:text-primary-ink text-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-border-subtle border-t">
        <div className="container-site text-muted flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
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
      <h2 className="text-muted text-sm font-bold tracking-wider uppercase">{title}</h2>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-primary-ink text-sm">
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
      className="border-border-subtle hover:bg-background grid size-9 place-items-center rounded-full border transition-colors"
    >
      {children}
    </a>
  )
}
