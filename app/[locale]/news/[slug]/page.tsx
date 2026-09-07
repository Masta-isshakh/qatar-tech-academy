import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/routing'
import { getPost } from '@/lib/content'
import { markdownToHtml } from '@/lib/markdown'
import { formatDate, pick } from '@/lib/utils'
import { Section } from '@/components/site/section'
import { MediaImage } from '@/components/site/media-image'

export const revalidate = 300
// Posts are created in the admin at any time; render on demand and cache.
export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getPost(slug)
  if (!post) return {}

  const title = pick(locale, post.titleEn, post.titleAr)
  const description = pick(locale, post.excerptEn, post.excerptAr)
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/news/${slug}`,
      languages: { ar: `/ar/news/${slug}`, en: `/en/news/${slug}` },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const post = await getPost(slug)
  if (!post) notFound()

  const t = await getTranslations('news')
  const Arrow = locale === 'ar' ? ArrowRight : ArrowLeft
  const body = markdownToHtml(pick(locale, post.bodyEn, post.bodyAr))

  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <Link
          href="/news"
          className="text-muted hover:text-primary-ink mb-6 inline-flex items-center gap-1.5 text-sm font-semibold"
        >
          <Arrow className="size-4" aria-hidden />
          {t('backToNews')}
        </Link>

        <h1 className="text-3xl md:text-4xl">{pick(locale, post.titleEn, post.titleAr)}</h1>
        {post.publishedAt ? (
          <p className="text-muted mt-2 text-sm">
            {t('publishedOn', { date: formatDate(post.publishedAt, locale) })}
          </p>
        ) : null}

        {post.coverKey ? (
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl">
            <MediaImage
              src={post.coverKey}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}

        {/* `body` comes from markdownToHtml, which escapes all source HTML. */}
        <div className="prose-qte mt-8" dangerouslySetInnerHTML={{ __html: body }} />
      </article>
    </Section>
  )
}
