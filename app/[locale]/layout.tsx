import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Cairo, Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { routing, dirOf, type Locale } from '@/i18n/routing'
import { site } from '@/lib/site'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AnalyticsProvider } from '@/components/providers/analytics'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { WhatsAppFloat } from '@/components/site/whatsapp-float'
import { CookieBanner } from '@/components/site/cookie-banner'

import '../globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  // `optional`, not `swap`: Cairo has no size-adjusted Arabic fallback, so the
  // swap reflowed every paragraph (measured CLS 0.184 on the track pages).
  // With `optional` the browser keeps the system Arabic face on a cold, slow
  // first load and uses Cairo from the cache on every visit after that.
  display: 'optional',
  // Two weights, not four: Cairo sits on the Arabic critical path and the extra
  // faces were the measured cause of the layout shift on text-heavy pages.
  weight: ['400', '700'],
  fallback: ['Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
  // Not preloaded: with `optional` the first, cold visit paints in the fallback
  // regardless, so putting a 48 KB Arabic face on the critical path only
  // delayed first contentful paint on exactly the pages that need it most.
  preload: false,
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#191919' },
  ],
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${t('siteName')} — ${t('tagline')}`,
      template: `%s · ${t('siteName')}`,
    },
    description: t('defaultDescription'),
    applicationName: t('siteName'),
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: '/ar', en: '/en', 'x-default': '/ar' },
    },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      title: `${t('siteName')} — ${t('tagline')}`,
      description: t('defaultDescription'),
      locale: locale === 'ar' ? 'ar_QA' : 'en_US',
      url: `${site.url}/${locale}`,
    },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/favicon.ico' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()
  const t = await getTranslations({ locale, namespace: 'nav' })

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      suppressHydrationWarning
      className={`${cairo.variable} ${inter.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AnalyticsProvider>
              <a
                href="#main"
                className="bg-primary text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-100 focus:rounded-lg focus:px-4 focus:py-2"
              >
                {t('skipToContent')}
              </a>
              <SiteHeader />
              <main id="main" className="min-h-[60vh]">
                {children}
              </main>
              <SiteFooter />
              <WhatsAppFloat />
              <CookieBanner />
              <Toaster
                position={locale === 'ar' ? 'bottom-left' : 'bottom-right'}
                dir={dirOf(locale)}
                richColors
                closeButton
              />
            </AnalyticsProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
