import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { getPartners, getTracks } from '@/lib/content'
import { isAmplifyConfigured } from '@/lib/amplify'
import { Section, SectionHeader } from '@/components/site/section'
import { MediaImage } from '@/components/site/media-image'
import { FadeUp } from '@/components/site/motion'
import { Marquee, PillarCard } from '@/components/site/blocks'
import { CorporateForm } from '@/components/forms/corporate-form'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'corporate' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `/${locale}/corporate`,
      languages: { ar: '/ar/corporate', en: '/en/corporate' },
    },
  }
}

export default async function CorporatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('corporate')
  const thome = await getTranslations('home.partners')
  const [tracks, partners] = await Promise.all([getTracks(), getPartners()])

  const values = t.raw('values') as { title: string; body: string }[]
  const weeks = t.raw('planWeeks') as { weeks: string; title: string; body: string }[]

  return (
    <>
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <FadeUp className="flex flex-col gap-5">
            <h1 className="text-4xl md:text-5xl">{t('title')}</h1>
            <p className="text-xl text-muted">{t('subtitle')}</p>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              <MediaImage
                src="/images/sections/corporate.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </FadeUp>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader title={t('valueTitle')} />
        <div className="grid gap-6 sm:grid-cols-2">
          {values.map((v, i) => (
            <PillarCard key={v.title} title={v.title} body={v.body} index={i} />
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader title={t('planTitle')} subtitle={t('planBody')} />
        <ol className="grid gap-4 md:grid-cols-4">
          {weeks.map((w, i) => (
            <FadeUp as="li" key={w.weeks} delay={i * 0.05}>
              <div className="flex h-full flex-col gap-2 rounded-2xl border border-border-subtle bg-background p-6">
                <span className="ltr-nums text-xs font-bold uppercase tracking-wider text-primary">
                  {w.weeks}
                </span>
                <h3 className="text-lg">{w.title}</h3>
                <p className="text-sm text-muted">{w.body}</p>
              </div>
            </FadeUp>
          ))}
        </ol>
      </Section>

      <Section tone="surface">
        <SectionHeader title={t('formTitle')} />
        <CorporateForm
          locale={locale}
          backendReady={isAmplifyConfigured}
          tracks={tracks
            .filter((tk) => !tk.isComingSoon)
            .map((tk) => ({
              slug: tk.slug,
              titleEn: tk.titleEn,
              titleAr: tk.titleAr,
              priceQar: tk.priceQar,
            }))}
        />
      </Section>

      <Section className="py-12">
        <SectionHeader title={thome('title')} subtitle={thome('note')} align="center" />
        <Marquee items={partners.map((p) => p.name)} />
      </Section>
    </>
  )
}
