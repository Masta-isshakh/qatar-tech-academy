import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getTracks } from '@/lib/content'
import { Section, SectionHeader } from '@/components/site/section'
import { TracksExplorer } from '@/components/site/tracks-explorer'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tracks' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: `/${locale}/tracks`, languages: { ar: '/ar/tracks', en: '/en/tracks' } },
  }
}

export default async function TracksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('tracks')
  const tc = await getTranslations('common')
  const th = await getTranslations('home.tracks')
  const tracks = await getTracks()

  return (
    <Section>
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />
      <TracksExplorer
        tracks={tracks}
        locale={locale}
        labels={{
          learnMore: tc('learnMore'),
          qar: tc('qar'),
          comingSoon: tc('comingSoon'),
          nextCohort: th('nextCohort'),
          cohortTbc: th('cohortTbc'),
        }}
      />
    </Section>
  )
}
