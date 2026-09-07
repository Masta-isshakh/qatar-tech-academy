import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AlertTriangle, ShieldCheck } from 'lucide-react'

import { getTracks } from '@/lib/content'
import { mapsEmbedUrl } from '@/lib/site'
import { Section, SectionHeader } from '@/components/site/section'
import { MediaImage } from '@/components/site/media-image'
import { FadeUp } from '@/components/site/motion'
import { Badge } from '@/components/ui/badge'
import { LeadForm } from '@/components/forms/lead-form'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'examCentre' })
  return {
    title: t('title'),
    description: t('intro'),
    alternates: {
      canonical: `/${locale}/exam-centre`,
      languages: { ar: '/ar/exam-centre', en: '/en/exam-centre' },
    },
  }
}

export default async function ExamCentrePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('examCentre')
  const tcontact = await getTranslations('contact')
  const tracks = await getTracks()

  const exams = t.raw('exams') as { name: string; body: string }[]
  const rules = t.raw('rules') as string[]

  return (
    <>
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <FadeUp className="flex flex-col gap-5">
            <Badge variant="brand" className="self-start">
              <ShieldCheck className="size-3.5" aria-hidden />
              Pearson VUE · EC-Council
            </Badge>
            <h1 className="text-4xl md:text-5xl">{t('title')}</h1>
            <p className="text-xl text-muted">{t('subtitle')}</p>
            <p className="text-lg leading-relaxed">{t('intro')}</p>
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('statusNote')}
            </p>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <MediaImage
                src="/images/sections/exam-centre.jpg"
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
        <SectionHeader title={t('examsTitle')} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <li
              key={exam.name}
              className="flex items-start justify-between gap-3 rounded-2xl border border-border-subtle bg-background p-5"
            >
              <span className="font-bold">{exam.name}</span>
              <Badge variant="neutral">{exam.body}</Badge>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mb-5 text-2xl md:text-3xl">{t('rulesTitle')}</h2>
            <ul className="flex flex-col gap-3">
              {rules.map((rule) => (
                <li key={rule} className="flex items-start gap-3 text-muted">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-5 text-2xl md:text-3xl">{t('roomTitle')}</h2>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <MediaImage
                src="/images/sections/certifications.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title={t('bookTitle')} subtitle={t('bookBody')} />
            <LeadForm
              source="exam-centre"
              locale={locale}
              showTrack
              tracks={tracks
                .filter((tk) => !tk.isComingSoon)
                .map((tk) => ({ slug: tk.slug, titleEn: tk.titleEn, titleAr: tk.titleAr }))}
            />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl">{tcontact('mapTitle')}</h2>
            <iframe
              title={tcontact('mapLabel')}
              src={mapsEmbedUrl(locale)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full rounded-2xl border border-border-subtle"
            />
          </div>
        </div>
      </Section>
    </>
  )
}
