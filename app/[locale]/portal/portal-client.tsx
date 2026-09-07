'use client'

import { ConfigureAmplifyClientSide } from '@/components/providers/configure-amplify'
import { AuthGate } from '@/components/portal/auth-gate'
import { PortalDashboard } from '@/components/portal/portal-dashboard'

export function PortalClient({ locale }: { locale: string }) {
  return (
    <>
      <ConfigureAmplifyClientSide />
      <AuthGate>{(user) => <PortalDashboard locale={locale} email={user.email} />}</AuthGate>
    </>
  )
}
