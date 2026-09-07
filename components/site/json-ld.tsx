import { site } from '@/lib/site'

/**
 * Renders a JSON-LD block. The payload is serialised with `<` escaped so a value
 * containing `</script>` cannot break out of the tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

export function organizationJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: locale === 'ar' ? site.nameAr : site.nameEn,
    alternateName: locale === 'ar' ? site.nameEn : site.nameAr,
    url: `${site.url}/${locale}`,
    email: site.email,
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Doha',
      addressCountry: 'QA',
      streetAddress: locale === 'ar' ? site.addressAr : site.addressEn,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    sameAs: [site.social.instagram, site.social.linkedin, site.social.youtube].filter(Boolean),
  }
}

export function courseJsonLd({
  locale,
  name,
  description,
  slug,
  priceQar,
  durationWeeks,
}: {
  locale: string
  name: string
  description: string
  slug: string
  priceQar: number
  durationWeeks: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    url: `${site.url}/${locale}/tracks/${slug}`,
    inLanguage: [locale, locale === 'ar' ? 'en' : 'ar'],
    provider: {
      '@type': 'EducationalOrganization',
      name: locale === 'ar' ? site.nameAr : site.nameEn,
      url: site.url,
    },
    ...(priceQar > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: priceQar,
            priceCurrency: 'QAR',
            category: 'Paid',
            url: `${site.url}/${locale}/register`,
          },
        }
      : {}),
    ...(durationWeeks > 0
      ? {
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'onsite',
            courseWorkload: `P${durationWeeks}W`,
            location: {
              '@type': 'Place',
              name: locale === 'ar' ? site.nameAr : site.nameEn,
              address: { '@type': 'PostalAddress', addressLocality: 'Doha', addressCountry: 'QA' },
            },
          },
        }
      : {}),
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}
