'use client'

import { AuthGate } from '@/components/portal/auth-gate'
import { PortalDashboard } from '@/components/portal/portal-dashboard'

export function PortalClient({ locale }: { locale: string }) {
  return (
    <AuthGate>{(user) => <PortalDashboard locale={locale} email={user.email} />}</AuthGate>
  )
}
