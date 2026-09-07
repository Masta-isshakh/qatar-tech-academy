import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The portal and admin are behind auth; the investor deck is unlisted.
        disallow: [
          '/ar/portal',
          '/en/portal',
          '/ar/admin',
          '/en/admin',
          '/ar/investors',
          '/en/investors',
          '/api/',
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
