import Link from 'next/link'
import { defaultLocale } from '@/i18n/routing'

/**
 * Global 404 for paths that never reach the `[locale]` segment (so there is no
 * layout to inherit). It renders its own <html>/<body>, which is also what stops
 * Next from falling back to the Pages Router document.
 */
export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#FAF7F2',
          color: '#222222',
        }}
      >
        <main style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem' }}>الصفحة غير موجودة</h1>
          <p style={{ color: '#6B6B6B', margin: '0 0 1.5rem' }}>Page not found</p>
          <Link
            href={`/${defaultLocale}`}
            style={{
              display: 'inline-block',
              background: '#8A1538',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            الرجوع للرئيسية
          </Link>
        </main>
      </body>
    </html>
  )
}
