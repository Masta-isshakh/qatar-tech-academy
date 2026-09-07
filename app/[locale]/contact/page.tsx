import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

import { getTracks } from '@/lib/content'
import { mapsEmbedUrl, site, whatsappLink } from '@/lib/site'
import { Section, SectionHeader } from '@/components/site/section'
import { LeadForm } from '@/components/forms/lead-form'
import { JsonLd, organizationJsonLd } from '@/components/site/json-ld'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { ar: '/ar/contact', en: '/en/contact' },
    },
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')
  const tracks = await getTracks()

  return (
    <Section>
      <JsonLd data={organizationJsonLd(locale)} />
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="grid gap-10 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-4">
          <ContactRow icon={<MessageCircle className="size-5" aria-hidden />} label={t('whatsappTitle')}>
            <a
              href={whatsappLink(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              className="ltr-nums font-semibold hover:text-primary"
            >
              +{site.whatsappNumber}
            </a>
          </ContactRow>

          <ContactRow icon={<Phone className="size-5" aria-hidden />} label={t('phoneTitle')}>
            <a
              href={`tel:${site.phone.replace(/\s/g, '')}`}
              className="ltr-nums font-semibold hover:text-primary"
            >
              {site.phone}
            </a>
          </ContactRow>

          <ContactRow icon={<Mail className="size-5" aria-hidden />} label={t('emailTitle')}>
            <a href={`mailto:${site.email}`} className="ltr-nums font-semibold hover:text-primary">
              {site.email}
            </a>
          </ContactRow>

          <ContactRow icon={<MapPin className="size-5" aria-hidden />} label={t('addressTitle')}>
            <p className="font-semibold">{locale === 'ar' ? site.addressAr : site.addressEn}</p>
          </ContactRow>

          <ContactRow icon={<Clock className="size-5" aria-hidden />} label={t('hoursTitle')}>
            <p className="text-sm">{t('hours')}</p>
          </ContactRow>

          <div className="mt-2">
            <h2 className="mb-3 text-lg font-bold">{t('mapTitle')}</h2>
            <iframe
              title={t('mapLabel')}
              src={mapsEmbedUrl(locale)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-square w-full rounded-2xl border border-border-subtle"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl">{t('formTitle')}</h2>
          <LeadForm
            source="contact"
            locale={locale}
            showTrack
            tracks={tracks
              .filter((tk) => !tk.isComingSoon)
              .map((tk) => ({ slug: tk.slug, titleEn: tk.titleEn, titleAr: tk.titleAr }))}
          />
        </div>
      </div>
    </Section>
  )
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-background p-4">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        {children}
      </div>
    </div>
  )
}
