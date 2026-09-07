import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getServerSession } from '@/lib/amplify-server'
import { isAmplifyConfigured } from '@/lib/amplify'
import { Section } from '@/components/site/section'
import { EmptyState } from '@/components/ui/states'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

/**
 * Server-side gate. The Cognito groups come from the ID token in the request
 * cookies, so a non-admin never receives the admin bundle's data — the client
 * Authenticator inside is for signing in, not for authorisation.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('admin')
  const tc = await getTranslations('common')
  const session = await getServerSession()

  // Signed-in but not an admin → 403 panel. Signed-out users fall through to the
  // Authenticator, which is what lets them sign in at all.
  if (isAmplifyConfigured && session.isSignedIn && !session.isAdmin) {
    return (
      <Section>
        <EmptyState
          title={t('deniedTitle')}
          body={t('deniedBody')}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/">{tc('backHome')}</Link>
            </Button>
          }
        />
      </Section>
    )
  }

  return children
}
