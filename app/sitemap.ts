import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/routing'
import { getPosts, getTracks } from '@/lib/content'
import { site } from '@/lib/site'

/** /investors is intentionally absent: it is unlisted and noindex. */
const STATIC_PATHS = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/tracks', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/exam-centre', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/corporate', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/register', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/news', priority: 0.6, changeFrequency: 'weekly' as const },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
]

function alternates(path: string) {
  return {
    languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`])),
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tracks, posts] = await Promise.all([getTracks(), getPosts()])
  const now = new Date()

  const staticEntries = locales.flatMap((locale) =>
    STATIC_PATHS.map((entry) => ({
      url: `${site.url}/${locale}${entry.path}`,
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: alternates(entry.path),
    }))
  )

  const trackEntries = locales.flatMap((locale) =>
    tracks
      .filter((t) => !t.isComingSoon)
      .map((t) => ({
        url: `${site.url}/${locale}/tracks/${t.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
        alternates: alternates(`/tracks/${t.slug}`),
      }))
  )

  const postEntries = locales.flatMap((locale) =>
    posts.map((p) => ({
      url: `${site.url}/${locale}/news/${p.slug}`,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: alternates(`/news/${p.slug}`),
    }))
  )

  return [...staticEntries, ...trackEntries, ...postEntries]
}
