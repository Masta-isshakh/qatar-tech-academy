/**
 * Single source of truth for the contact details, domain and social handles.
 *
 * ⚠️ PLACEHOLDERS — every value below marked `TODO` is a stand-in. Override it with the
 * matching `NEXT_PUBLIC_*` environment variable in Amplify Hosting (or `.env.local`),
 * or edit this file once the real values are known. See README §"Environment variables".
 */

/** WhatsApp number in international format, digits only, no `+`. */
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '97400000000' // TODO

export const site = {
  /** Canonical origin, no trailing slash. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.qatartech.education').replace(/\/$/, ''), // TODO

  nameEn: 'Qatar Tech Education',
  nameAr: 'أكاديمية قطر للتقنية',

  whatsappNumber: WHATSAPP_NUMBER,
  phone: process.env.NEXT_PUBLIC_PHONE ?? '+974 0000 0000', // TODO
  email: process.env.NEXT_PUBLIC_EMAIL ?? 'hello@qatartech.education', // TODO
  corporateEmail: process.env.NEXT_PUBLIC_CORPORATE_EMAIL ?? 'corporate@qatartech.education', // TODO

  addressEn: process.env.NEXT_PUBLIC_ADDRESS_EN ?? 'Doha, Qatar', // TODO
  addressAr: process.env.NEXT_PUBLIC_ADDRESS_AR ?? 'الدوحة، قطر', // TODO

  /** Used for the Google Maps embed and the JSON-LD geo block. */
  geo: { lat: 25.2854, lng: 51.531 }, // TODO — Doha city centre until the site is confirmed

  /** MoEHE licence number; shown in the footer once granted. */
  licenceNumber: process.env.NEXT_PUBLIC_LICENCE_NUMBER ?? '', // TODO

  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? 'https://instagram.com/', // TODO
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN ?? 'https://linkedin.com/', // TODO
    x: process.env.NEXT_PUBLIC_X ?? 'https://x.com/', // TODO
    youtube: process.env.NEXT_PUBLIC_YOUTUBE ?? 'https://youtube.com/', // TODO
  },

  analytics: {
    ga4: process.env.NEXT_PUBLIC_GA4_ID ?? '',
    metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',
  },

  /** Cloudflare Turnstile site key. Empty disables the widget; the honeypot still runs. */
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
} as const

/** `https://wa.me/…` deep link with a pre-filled message. */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.whatsappNumber}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function mapsEmbedUrl(locale: string) {
  const { lat, lng } = site.geo
  return `https://www.google.com/maps?q=${lat},${lng}&hl=${locale}&z=14&output=embed`
}

export const NAV_LINKS = [
  { href: '/tracks', key: 'tracks' },
  { href: '/exam-centre', key: 'examCentre' },
  { href: '/corporate', key: 'corporate' },
  { href: '/about', key: 'about' },
  { href: '/news', key: 'news' },
  { href: '/contact', key: 'contact' },
] as const
