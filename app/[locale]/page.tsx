import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft, ArrowRight, MessageCircle, QrCode, Smartphone } from 'lucide-react'

import { Link } from '@/i18n/routing'
import { getPartners, getTestimonials, getTracks, getVideoKeys } from '@/lib/content'
import { pick } from '@/lib/utils'
import { whatsappLink } from '@/lib/site'
import { HERO_VIDEO_KEY, LAB_GALLERY } from '@/data/seed-content'

import { Button } from '@/components/ui/button'
import { Section, SectionHeader } from '@/components/site/section'
import { HeroSlider } from '@/components/site/hero-slider'
import { TrackCard } from '@/components/site/track-card'
import { FadeUp } from '@/components/site/motion'
import { FaqAccordion, type FaqItem } from '@/components/site/faq-accordion'
import { MediaImage } from '@/components/site/media-image'
import {
  LabGallery,
  Marquee,
  PillarCard,
  StatTile,
  TestimonialCard,
  Timeline,
} from '@/components/site/blocks'
import { JsonLd, faqJsonLd, organizationJsonLd } from '@/components/site/json-ld'

export const revalidate = 300

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('home')
  const tc = await getTranslations('common')
  const [tracks, testimonials, partners, videoKeys] = await Promise.all([
    getTracks(),
    getTestimonials(),
    getPartners(),
    getVideoKeys(),
  ])

  const faqItems = t.raw('faq.items') as FaqItem[]
  const pillars = t.raw('why.pillars') as { title: string; body: string }[]
  const stats = t.raw('stats.items') as { value: string; label: string }[]
  const steps = t.raw('howItWorks.steps') as { title: string; body: string }[]
  const labCaptions = t.raw('labs.captions') as string[]
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  const cardLabels = {
    learnMore: tc('learnMore'),
    qar: tc('qar'),
    comingSoon: tc('comingSoon'),
    nextCohort: t('tracks.nextCohort'),
    cohortTbc: t('tracks.cohortTbc'),
  }

  return (
    <>
      <JsonLd data={organizationJsonLd(locale)} />
      <JsonLd data={faqJsonLd(faqItems)} />

      <HeroSlider heroVideoKey={videoKeys.has(HERO_VIDEO_KEY) ? HERO_VIDEO_KEY : undefined} />

      {/* 2 — the question, and the six tracks */}
      <Section id="tracks">
        <SectionHeader
          title={t('tracks.title')}
          subtitle={t('tracks.subtitle')}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/tracks">{t('tracks.viewAll')}</Link>
            </Button>
          }
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, i) => (
            <FadeUp as="li" key={track.id} delay={Math.min(i, 3) * 0.05} className="h-full">
              <TrackCard track={track} locale={locale} labels={cardLabels} priority={i < 3} />
            </FadeUp>
          ))}
        </ul>
      </Section>

      {/* 3 — why practice-first */}
      <Section tone="surface">
        <SectionHeader title={t('why.title')} subtitle={t('why.subtitle')} align="center" />
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => (
            <PillarCard key={p.title} title={p.title} body={p.body} index={i} />
          ))}
        </div>
      </Section>

      {/* 4 — stats */}
      <Section className="py-12 md:py-16">
        <h2 className="sr-only">{t('stats.title')}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <StatTile key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </Section>

      {/* 5 — inside the labs */}
      <Section tone="surface">
        <SectionHeader title={t('labs.title')} subtitle={t('labs.subtitle')} />
        <LabGallery items={LAB_GALLERY} captions={labCaptions} />
      </Section>

      {/* 6 — how it works */}
      <Section>
        <SectionHeader title={t('howItWorks.title')} subtitle={t('howItWorks.subtitle')} />
        <Timeline steps={steps} />
      </Section>

      {/* 7 & 8 — exam centre and corporate teasers */}
      <Section tone="surface">
        <div className="grid gap-6 lg:grid-cols-2">
          <Teaser
            title={t('examCentre.title')}
            body={t('examCentre.body')}
            cta={t('examCentre.cta')}
            href="/exam-centre"
            image="/images/sections/exam-centre.jpg"
            arrow={<Arrow className="size-4" aria-hidden />}
          />
          <Teaser
            title={t('corporate.title')}
            body={t('corporate.body')}
            cta={t('corporate.cta')}
            href="/corporate"
            image="/images/sections/corporate.jpg"
            arrow={<Arrow className="size-4" aria-hidden />}
          />
        </div>
      </Section>

      {/* 9 — the app */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <FadeUp className="flex flex-col gap-5">
            <h2 className="text-3xl md:text-4xl">{t('app.title')}</h2>
            <p className="text-muted text-lg">{t('app.body')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="border-border-subtle text-muted inline-flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm">
                <Smartphone className="size-4" aria-hidden />
                {t('app.comingSoonBadge')}
              </span>
              <span className="border-border-subtle text-muted inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
                <QrCode className="size-4" aria-hidden />
                {t('app.qrCaption')}
              </span>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl">
              <MediaImage
                src="/images/sections/app.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </FadeUp>
        </div>
      </Section>

      {/* 10 — testimonials (hidden when nothing is published) */}
      {testimonials.length > 0 ? (
        <Section tone="surface">
          <SectionHeader title={t('testimonials.title')} align="center" />
          <ul className="grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((item, i) => (
              <FadeUp as="li" key={item.id} delay={i * 0.06} className="h-full">
                <TestimonialCard
                  quote={pick(locale, item.quoteEn, item.quoteAr)}
                  name={item.name}
                  role={pick(locale, item.roleEn, item.roleAr)}
                />
              </FadeUp>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 11 — partners in discussion */}
      <Section className="py-12 md:py-16">
        <SectionHeader title={t('partners.title')} subtitle={t('partners.note')} align="center" />
        <Marquee items={partners.map((p) => p.name)} />
      </Section>

      {/* 12 — FAQ */}
      <Section tone="surface">
        <SectionHeader title={t('faq.title')} align="center" />
        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={faqItems} idPrefix="home-faq" />
        </div>
      </Section>

      {/* 13 — final CTA */}
      <Section tone="brand" className="py-16">
        <div className="flex flex-col items-center gap-5 text-center">
          <h2 className="max-w-2xl text-3xl md:text-4xl">{t('finalCta.title')}</h2>
          <p className="max-w-xl text-lg text-white/85">{t('finalCta.body')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">{t('finalCta.primary')}</Link>
            </Button>
            <Button asChild size="lg" variant="outlineOnMedia">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-5" aria-hidden />
                {t('finalCta.secondary')}
              </a>
            </Button>
          </div>
          <p className="sr-only">{tc('qar')}</p>
        </div>
      </Section>
    </>
  )
}

function Teaser({
  title,
  body,
  cta,
  href,
  image,
  arrow,
}: {
  title: string
  body: string
  cta: string
  href: string
  image: string
  arrow: React.ReactNode
}) {
  return (
    <FadeUp className="h-full">
      <article className="border-border-subtle bg-background flex h-full flex-col overflow-hidden rounded-2xl border">
        <div className="relative aspect-[16/9]">
          <MediaImage
            src={image}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-7">
          <h3 className="text-2xl">{title}</h3>
          <p className="text-muted">{body}</p>
          <Button asChild variant="secondary" size="sm" className="mt-auto self-start">
            <Link href={href}>
              {cta}
              {arrow}
            </Link>
          </Button>
        </div>
      </article>
    </FadeUp>
  )
}
