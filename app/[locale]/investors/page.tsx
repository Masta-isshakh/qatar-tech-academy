import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { FileDown } from 'lucide-react'

import { HERO_VIDEO_KEY, PLAN_VIDEO_KEY } from '@/data/seed-content'
import { getVideoKeys } from '@/lib/content'
import { site } from '@/lib/site'
import { Section, SectionHeader } from '@/components/site/section'
import { VideoPlayer } from '@/components/site/video-player'
import { StatTile } from '@/components/site/blocks'
import { FadeUp } from '@/components/site/motion'
import { LeadForm } from '@/components/forms/lead-form'
import { Button } from '@/components/ui/button'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'investors' })
  return {
    title: t('title'),
    description: t('subtitle'),
    // Deliberately unlisted: the URL is plain, but it must not be indexed.
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function InvestorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('investors')
  const videoKeys = await getVideoKeys()
  const numbers = t.raw('numbers') as { value: string; label: string }[]

  return (
    <>
      <Section>
        <FadeUp className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-4xl md:text-5xl">{t('title')}</h1>
          <p className="text-muted text-xl">{t('subtitle')}</p>
        </FadeUp>
      </Section>

      <Section tone="surface" className="pt-0 md:pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl">{t('pitchTitle')}</h2>
            <VideoPlayer
              storageKey={videoKeys.has(HERO_VIDEO_KEY) ? HERO_VIDEO_KEY : undefined}
              poster="/images/sections/workshop.jpg"
              posterAlt={t('pitchTitle')}
              className="aspect-video w-full"
            />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl">{t('planTitle')}</h2>
            <VideoPlayer
              storageKey={videoKeys.has(PLAN_VIDEO_KEY) ? PLAN_VIDEO_KEY : undefined}
              poster="/images/sections/cascade.jpg"
              posterAlt={t('planTitle')}
              className="aspect-video w-full"
            />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader title={t('numbersTitle')} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {numbers.map((n) => (
            <StatTile key={n.label} value={n.value} label={n.label} />
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl">{t('downloadTitle')}</h2>
            <p className="text-muted">{t('downloadBody')}</p>
            <Button asChild variant="secondary" className="self-start">
              <a href={`mailto:${site.email}?subject=Executive%20summary`}>
                <FileDown className="size-4" aria-hidden />
                {t('download')}
              </a>
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl">{t('contactTitle')}</h2>
            <p className="text-muted">{t('contactBody')}</p>
            <LeadForm source="investor" locale={locale} />
          </div>
        </div>
      </Section>
    </>
  )
}
