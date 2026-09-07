import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getTestSlots, getTracks } from '@/lib/content'
import { isAmplifyConfigured } from '@/lib/amplify'
import { Section, SectionHeader } from '@/components/site/section'
import { RegisterWizard } from '@/components/register/register-wizard'

// Slot availability changes as people book, so this page is always fresh.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'register' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `/${locale}/register`,
      languages: { ar: '/ar/register', en: '/en/register' },
    },
  }
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ track?: string }>
}) {
  const { locale } = await params
  const { track } = await searchParams
  setRequestLocale(locale)

  const t = await getTranslations('register')
  const [tracks, slots] = await Promise.all([getTracks(), getTestSlots()])

  return (
    <Section>
      <SectionHeader title={t('title')} subtitle={t('subtitle')} align="center" />
      <RegisterWizard
        locale={locale}
        initialTrack={tracks.some((x) => x.slug === track) ? track : undefined}
        backendReady={isAmplifyConfigured}
        tracks={tracks.map((x) => ({
          slug: x.slug,
          titleEn: x.titleEn,
          titleAr: x.titleAr,
          taglineEn: x.taglineEn,
          taglineAr: x.taglineAr,
          priceQar: x.priceQar,
          isComingSoon: x.isComingSoon,
        }))}
        slots={slots.map((s) => ({
          id: s.id,
          start: s.start,
          end: s.end,
          room: s.room,
          capacity: s.capacity,
          booked: s.booked,
        }))}
      />
    </Section>
  )
}
