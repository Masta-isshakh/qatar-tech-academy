'use client'

import { AuthGate } from '@/components/portal/auth-gate'
import { AdminShell } from '@/components/admin/admin-shell'

export function AdminClient({ locale }: { locale: string }) {
  return <AuthGate>{(user) => <AdminShell locale={locale} email={user.email} />}</AuthGate>
}
