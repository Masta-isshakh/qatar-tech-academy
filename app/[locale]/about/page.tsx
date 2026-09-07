import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { getPartners, getTracks } from '@/lib/content'
import { site } from '@/lib/site'
import { pick } from '@/lib/utils'
import { Section, SectionHeader } from '@/components/site/section'
import { MediaImage } from '@/components/site/media-image'
import { FadeUp } from '@/components/site/motion'
import { Marquee, Timeline, TrainerCard } from '@/components/site/blocks'
import { EmptyState } from '@/components/ui/states'
import { Badge } from '@/components/ui/badge'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: `/${locale}/about`, languages: { ar: '/ar/about', en: '/en/about' } },
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('about')
  const thome = await getTranslations('home.partners')
  const [tracks, partners] = await Promise.all([getTracks(), getPartners()])

  const cascade = t.raw('cascadeSteps') as { title: string; body: string }[]
  const phases = t.raw('phases') as { name: string; duration: string; body: string }[]
  const trainers = tracks.flatMap((tk) => tk.trainers)

  return (
    <>
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <FadeUp className="flex flex-col gap-5">
            <h1 className="text-4xl md:text-5xl">{t('title')}</h1>
            <p className="text-muted text-xl">{t('subtitle')}</p>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
              <MediaImage
                src="/images/sections/doha-sunrise.jpg"
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
        <div className="grid gap-10 lg:grid-cols-2">
          <FadeUp className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl">{t('storyTitle')}</h2>
            <p className="text-muted leading-relaxed">{t('story')}</p>
          </FadeUp>
          <FadeUp delay={0.06} className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl">{t('methodTitle')}</h2>
            <p className="text-muted leading-relaxed">{t('method')}</p>
          </FadeUp>
        </div>
      </Section>

      <Section>
        <SectionHeader title={t('cascadeTitle')} subtitle={t('cascade')} />
        <Timeline steps={cascade} />
      </Section>

      <Section tone="surface">
        <SectionHeader title={t('teamTitle')} subtitle={t('teamNote')} />
        {trainers.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((tr) => (
              <li key={tr.id}>
                <TrainerCard
                  name={tr.name}
                  title={pick(locale, tr.titleEn, tr.titleAr)}
                  bio={pick(locale, tr.bioEn, tr.bioAr)}
                  credentials={tr.credentials}
                  photoKey={tr.photoKey}
                  country={tr.country}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t('teamNote')} />
        )}
      </Section>

      <Section>
        <SectionHeader title={t('phasesTitle')} />
        <div className="grid gap-6 md:grid-cols-2">
          {phases.map((phase, i) => (
            <FadeUp key={phase.name} delay={i * 0.06}>
              <div className="border-border-subtle bg-background flex h-full flex-col gap-3 rounded-2xl border p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl">{phase.name}</h3>
                  <Badge variant="brand">{phase.duration}</Badge>
                </div>
                <p className="text-muted">{phase.body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
        <p className="border-border-subtle bg-surface mt-8 rounded-2xl border p-5 text-sm">
          <span className="font-bold">{t('licenceLabel')}: </span>
          <span className="ltr-nums">{site.licenceNumber || t('licencePending')}</span>
        </p>
      </Section>

      <Section tone="surface" className="py-12">
        <SectionHeader title={t('partnersTitle')} subtitle={thome('note')} align="center" />
        <Marquee items={partners.map((p) => p.name)} />
      </Section>
    </>
  )
}
