'use client'

import { ConfigureAmplifyClientSide } from '@/components/providers/configure-amplify'
import { AuthGate } from '@/components/portal/auth-gate'
import { AdminShell } from '@/components/admin/admin-shell'

export function AdminClient({ locale }: { locale: string }) {
  return (
    <>
      <ConfigureAmplifyClientSide />
      <AuthGate>{(user) => <AdminShell locale={locale} email={user.email} />}</AuthGate>
    </>
  )
}
