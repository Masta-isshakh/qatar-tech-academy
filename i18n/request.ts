import { getRequestConfig } from 'next-intl/server'
import { routing, type Locale } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: Locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Qatar',
    formats: {
      number: {
        // Prices are always rendered with Western digits, per the brand guide.
        qar: { style: 'decimal', maximumFractionDigits: 0 },
      },
    },
  }
})
