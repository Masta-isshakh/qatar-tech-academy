import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'

export const alt = 'Qatar Tech Education'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Drawn rather than photographed so the card is always available, in both
 * locales, before any artwork is uploaded.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: 'linear-gradient(135deg, #8A1538 0%, #6E1029 55%, #222222 100%)',
        color: '#FFFFFF',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: '#FFFFFF',
            color: '#8A1538',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            fontWeight: 900,
          }}
        >
          Q
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 30, fontWeight: 700 }}>Qatar Tech Education</span>
          <span style={{ fontSize: 24, opacity: 0.8 }}>أكاديمية قطر للتقنية</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.15, maxWidth: 950 }}>
          {t('tagline')}
        </span>
        <span style={{ fontSize: 28, opacity: 0.85 }}>
          {locale === 'ar'
            ? 'روبوتات · درونز · شبكات · أمن سيبراني · ذكاء اصطناعي'
            : 'Robotics · Drones · Networking · Cybersecurity · AI'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, opacity: 0.8 }}>
        <div style={{ width: 120, height: 6, background: '#E8DCC4', borderRadius: 99 }} />
        <span>{locale === 'ar' ? 'الدوحة، قطر' : 'Doha, Qatar'}</span>
      </div>
    </div>,
    size
  )
}
