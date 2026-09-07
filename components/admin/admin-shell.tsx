'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthenticator } from '@aws-amplify/ui-react'

import { MODEL_SPECS } from '@/lib/admin-models'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import { ModelManager } from './model-manager'
import { MediaUploader } from './media-uploader'
import {
  AppointmentsCalendar,
  DashboardTiles,
  LeadsTable,
  RegistrationsTable,
} from './pipeline-tables'

type TabId = 'dashboard' | 'leads' | 'registrations' | 'appointments' | 'content' | 'media'

export function AdminShell({ locale, email }: { locale: string; email?: string }) {
  const t = useTranslations('admin')
  const tPortal = useTranslations('portal')
  const { signOut } = useAuthenticator((ctx) => [ctx.user])
  const [tab, setTab] = useState<TabId>('dashboard')
  const [contentModel, setContentModel] = useState(MODEL_SPECS[0]!.model)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: t('dashboard') },
    { id: 'leads', label: t('leads') },
    { id: 'registrations', label: t('registrations') },
    { id: 'appointments', label: t('appointments') },
    { id: 'content', label: t('content') },
    { id: 'media', label: t('media') },
  ]

  const spec = MODEL_SPECS.find((s) => s.model === contentModel) ?? MODEL_SPECS[0]!

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t('title')}</h1>
          {email ? <p className="ltr-nums text-muted text-sm">{email}</p> : null}
        </div>
        <Button variant="secondary" size="sm" onClick={signOut}>
          {tPortal('signOut')}
        </Button>
      </header>

      <div role="tablist" aria-label={t('title')} className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              tab === item.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border-subtle hover:bg-surface'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'dashboard' ? <DashboardTiles locale={locale} /> : null}
        {tab === 'leads' ? <LeadsTable locale={locale} /> : null}
        {tab === 'registrations' ? <RegistrationsTable locale={locale} /> : null}
        {tab === 'appointments' ? <AppointmentsCalendar locale={locale} /> : null}
        {tab === 'media' ? <MediaUploader /> : null}
        {tab === 'content' ? (
          <div className="flex flex-col gap-4">
            <label className="flex max-w-xs items-center gap-2 text-sm">
              <span className="text-muted">{t('content')}</span>
              <Select value={contentModel} onChange={(e) => setContentModel(e.target.value)}>
                {MODEL_SPECS.map((s) => (
                  <option key={s.model} value={s.model}>
                    {locale === 'ar' ? s.labelAr : s.labelEn}
                  </option>
                ))}
              </Select>
            </label>
            <ModelManager key={spec.model} spec={spec} locale={locale} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
