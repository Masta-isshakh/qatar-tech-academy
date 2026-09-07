import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Cairo, Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { routing, dirOf, type Locale } from '@/i18n/routing'
import { site } from '@/lib/site'
import { ConfigureAmplifyClientSide } from '@/components/providers/configure-amplify'
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
  display: 'swap',
  weight: ['400', '600', '700', '800'],
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
              <ConfigureAmplifyClientSide />
              <a
                href="#main"
                className="sr-only bg-primary text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-100 focus:rounded-lg focus:px-4 focus:py-2"
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
