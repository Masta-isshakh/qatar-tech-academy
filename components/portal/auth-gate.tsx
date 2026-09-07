'use client'

import { Authenticator, translations as amplifyTranslations } from '@aws-amplify/ui-react'
import { I18n } from 'aws-amplify/utils'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { hasAuth } from '@/lib/amplify'
import { EmptyState } from '@/components/ui/states'
import { Section } from '@/components/site/section'

import '@aws-amplify/ui-react/styles.css'

I18n.putVocabularies(amplifyTranslations)

/**
 * Wraps the portal and admin areas in the Cognito Authenticator.
 *
 * When no user pool is configured yet (fresh clone, no sandbox) it renders an
 * explanatory panel rather than crashing — the marketing site must stay usable.
 */
export function AuthGate({
  children,
}: {
  children: (user: { username: string; email?: string }) => ReactNode
}) {
  const locale = useLocale()
  const t = useTranslations('common')
  I18n.setLanguage(locale === 'ar' ? 'ar' : 'en')

  if (!hasAuth) {
    return (
      <Section>
        <EmptyState title={t('error')} body={t('errorBody')} />
      </Section>
    )
  }

  return (
    <div className="container-site py-12">
      <Authenticator signUpAttributes={['email']} loginMechanisms={['email']}>
        {({ user }) =>
          (
            <>
              {children({
                username: user?.username ?? '',
                email:
                  (user?.signInDetails?.loginId as string | undefined) ??
                  (user?.username as string | undefined),
              })}
            </>
          ) as never
        }
      </Authenticator>
    </div>
  )
}
