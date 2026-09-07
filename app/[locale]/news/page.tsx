import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/routing'
import { getPosts } from '@/lib/content'
import { formatDate, pick } from '@/lib/utils'
import { Section, SectionHeader } from '@/components/site/section'
import { MediaImage } from '@/components/site/media-image'
import { EmptyState } from '@/components/ui/states'
import { FadeUp } from '@/components/site/motion'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'news' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: `/${locale}/news`, languages: { ar: '/ar/news', en: '/en/news' } },
  }
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('news')
  const posts = await getPosts()

  return (
    <Section>
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />

      {posts.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <FadeUp as="li" key={post.id} delay={Math.min(i, 3) * 0.05}>
              <Link
                href={`/news/${post.slug}`}
                className="group border-border-subtle bg-background flex h-full flex-col overflow-hidden rounded-2xl border"
              >
                <div className="relative aspect-[16/9]">
                  <MediaImage
                    src={post.coverKey || '/images/sections/workshop.jpg'}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-muted text-xs">
                    {post.publishedAt
                      ? t('publishedOn', { date: formatDate(post.publishedAt, locale) })
                      : ''}
                  </p>
                  <h2 className="group-hover:text-primary text-lg">
                    {pick(locale, post.titleEn, post.titleAr)}
                  </h2>
                  <p className="text-muted text-sm">
                    {pick(locale, post.excerptEn, post.excerptAr)}
                  </p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </ul>
      )}
    </Section>
  )
}
