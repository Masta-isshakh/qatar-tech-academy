'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'

import { authedClient } from '@/lib/amplify-client'
import { LEAD_STATUSES, REGISTRATION_STATUSES } from '@/lib/admin-models'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'
import { ListSkeleton, EmptyState } from '@/components/ui/states'
import { DataTable } from './data-table'

/* eslint-disable @typescript-eslint/no-explicit-any */

function useModelList<T>(model: string, limit = 500) {
  const [rows, setRows] = useState<T[] | null>(null)

  const load = useCallback(async () => {
    const client = authedClient()
    const api = (client?.models as any)?.[model]
    if (!api) {
      setRows([])
      return
    }
    try {
      const { data } = await api.list({ limit })
      setRows((data ?? []) as T[])
    } catch (err) {
      console.error(`[admin] ${model}.list failed`, err)
      setRows([])
    }
  }, [model, limit])

  useEffect(() => {
    void load()
  }, [load])

  return { rows, reload: load, setRows }
}

/* --------------------------------------------------------------------- leads */

type Lead = {
  id: string
  name: string
  phone: string
  email?: string | null
  organisation?: string | null
  trackSlug?: string | null
  source?: string | null
  status?: string | null
  message?: string | null
  createdAt?: string | null
}

export function LeadsTable({ locale }: { locale: string }) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')
  const { rows, reload } = useModelList<Lead>('Lead')
  const [selected, setSelected] = useState<string[]>([])

  const columns = useMemo<ColumnDef<Lead, unknown>[]>(
    () => [
      selectionColumn<Lead>(),
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'phone', header: 'Phone', cell: (c) => <span className="ltr-nums">{String(c.getValue() ?? '')}</span> },
      { accessorKey: 'email', header: 'Email', cell: (c) => <span className="ltr-nums">{String(c.getValue() ?? '—')}</span> },
      { accessorKey: 'trackSlug', header: 'Track' },
      { accessorKey: 'source', header: 'Source' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (c) => <Badge variant="neutral">{String(c.getValue() ?? 'NEW')}</Badge>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: (c) => formatDate(String(c.getValue() ?? ''), locale),
      },
    ],
    [locale]
  )

  async function bulkStatus(status: string) {
    const client = authedClient()
    if (!client || selected.length === 0) return
    try {
      await Promise.all(selected.map((id) => (client.models as any).Lead.update({ id, status })))
      toast.success(tc('save'))
      await reload()
    } catch (err) {
      console.error('[admin] lead bulk update failed', err)
      toast.error(tc('error'))
    }
  }

  if (rows === null) return <ListSkeleton rows={5} />

  return (
    <DataTable
      data={rows}
      columns={columns}
      csvName="leads"
      csvColumns={['id', 'name', 'phone', 'email', 'organisation', 'trackSlug', 'source', 'status', 'message', 'createdAt']}
      onSelectionChange={setSelected}
      toolbar={() => (
        <Select
          aria-label={t('bulkStatus')}
          className="h-9 w-auto py-0 text-sm"
          value=""
          onChange={(e) => e.target.value && bulkStatus(e.target.value)}
          disabled={selected.length === 0}
        >
          <option value="">{t('bulkStatus')}</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      )}
    />
  )
}

/* ------------------------------------------------------------- registrations */

type Registration = {
  id: string
  name: string
  phone: string
  email: string
  occupation?: string | null
  university?: string | null
  employer?: string | null
  trackSlug?: string | null
  status?: string | null
  testScore?: number | null
  createdAt?: string | null
}

export function RegistrationsTable({ locale }: { locale: string }) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')
  const { rows, reload, setRows } = useModelList<Registration>('Registration')
  const [selected, setSelected] = useState<string[]>([])

  async function saveScore(id: string, score: number | null) {
    const client = authedClient()
    if (!client) return
    try {
      await (client.models as any).Registration.update({ id, testScore: score })
      setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, testScore: score } : r)) ?? prev)
    } catch (err) {
      console.error('[admin] score update failed', err)
      toast.error(tc('error'))
    }
  }

  const columns = useMemo<ColumnDef<Registration, unknown>[]>(
    () => [
      selectionColumn<Registration>(),
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'phone', header: 'Phone', cell: (c) => <span className="ltr-nums">{String(c.getValue() ?? '')}</span> },
      { accessorKey: 'email', header: 'Email', cell: (c) => <span className="ltr-nums">{String(c.getValue() ?? '')}</span> },
      { accessorKey: 'trackSlug', header: 'Track' },
      { accessorKey: 'occupation', header: 'Occupation' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (c) => <Badge variant="neutral">{String(c.getValue() ?? 'APPLIED')}</Badge>,
      },
      {
        id: 'testScore',
        header: 'Score',
        accessorKey: 'testScore',
        cell: ({ row }) => (
          <Input
            type="number"
            dir="ltr"
            min={0}
            max={100}
            defaultValue={row.original.testScore ?? ''}
            aria-label={`Score — ${row.original.name}`}
            className="h-8 w-20 px-2 py-0 text-sm"
            onBlur={(e) => {
              const raw = e.target.value
              const next = raw === '' ? null : Number(raw)
              if (next !== (row.original.testScore ?? null)) void saveScore(row.original.id, next)
            }}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: (c) => formatDate(String(c.getValue() ?? ''), locale),
      },
    ],
    // saveScore is stable enough for this table's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  )

  async function bulkStatus(status: string) {
    const client = authedClient()
    if (!client || selected.length === 0) return
    try {
      await Promise.all(
        selected.map((id) => (client.models as any).Registration.update({ id, status }))
      )
      toast.success(tc('save'))
      await reload()
    } catch (err) {
      console.error('[admin] registration bulk update failed', err)
      toast.error(tc('error'))
    }
  }

  if (rows === null) return <ListSkeleton rows={5} />

  return (
    <DataTable
      data={rows}
      columns={columns}
      csvName="registrations"
      csvColumns={[
        'id',
        'name',
        'phone',
        'email',
        'occupation',
        'university',
        'employer',
        'trackSlug',
        'status',
        'testScore',
        'createdAt',
      ]}
      onSelectionChange={setSelected}
      toolbar={() => (
        <Select
          aria-label={t('bulkStatus')}
          className="h-9 w-auto py-0 text-sm"
          value=""
          onChange={(e) => e.target.value && bulkStatus(e.target.value)}
          disabled={selected.length === 0}
        >
          <option value="">{t('bulkStatus')}</option>
          {REGISTRATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      )}
    />
  )
}

/* -------------------------------------------------------------- appointments */

type Appointment = {
  id: string
  registrationId: string
  slotStart?: string | null
  slotEnd?: string | null
  room?: string | null
  status?: string | null
}

/** Day view: appointments grouped by calendar day, nearest first. */
export function AppointmentsCalendar({ locale }: { locale: string }) {
  const t = useTranslations('admin')
  const { rows } = useModelList<Appointment>('TestAppointment')

  const days = useMemo(() => {
    const groups = new Map<string, Appointment[]>()
    for (const row of rows ?? []) {
      const day = (row.slotStart ?? '').slice(0, 10)
      if (!day) continue
      groups.set(day, [...(groups.get(day) ?? []), row])
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, items]) => ({
        day,
        items: items.sort((a, b) => (a.slotStart ?? '').localeCompare(b.slotStart ?? '')),
      }))
  }, [rows])

  if (rows === null) return <ListSkeleton rows={4} />
  if (days.length === 0) return <EmptyState title={t('noRows')} />

  return (
    <div className="flex flex-col gap-6">
      {days.map(({ day, items }) => (
        <section key={day}>
          <h3 className="mb-2 flex items-baseline gap-3 text-lg font-bold">
            {formatDate(day, locale)}
            <span className="ltr-nums text-sm font-normal text-muted">
              {items.length} · {t('occupancy')}
            </span>
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm"
              >
                <span>{formatDateTime(a.slotStart, locale)}</span>
                <span className="flex items-center gap-2">
                  {a.room ? <span className="text-muted">{a.room}</span> : null}
                  <Badge variant="neutral">{a.status ?? 'BOOKED'}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */

function selectionColumn<T>(): ColumnDef<T, unknown> {
  return {
    id: 'select',
    enableSorting: false,
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label="Select row"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }
}

export { useModelList }

export function DashboardTiles({ locale }: { locale: string }) {
  const t = useTranslations('admin')
  const { rows: leads } = useModelList<Lead>('Lead')
  const { rows: registrations } = useModelList<Registration>('Registration')
  const { rows: appointments } = useModelList<Appointment>('TestAppointment')

  if (!leads || !registrations || !appointments) return <ListSkeleton rows={2} />

  const today = new Date().toISOString().slice(0, 10)
  const newToday = leads.filter((l) => (l.createdAt ?? '').startsWith(today)).length

  const byTrack = registrations.reduce<Record<string, number>>((acc, r) => {
    const key = r.trackSlug ?? '—'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const upcoming = appointments
    .filter((a) => (a.slotStart ?? '') >= today)
    .sort((a, b) => (a.slotStart ?? '').localeCompare(b.slotStart ?? ''))
  const nextDay = upcoming[0]?.slotStart?.slice(0, 10) ?? null
  const nextDayCount = nextDay ? upcoming.filter((a) => a.slotStart?.startsWith(nextDay)).length : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tile label={t('newLeadsToday')} value={String(newToday)} />
      <Tile label={t('registrationsTotal')} value={String(registrations.length)} />
      <Tile
        label={t('nextTestDay')}
        value={nextDay ? `${formatDate(nextDay, locale)} · ${nextDayCount}` : '—'}
      />
      <div className="rounded-2xl border border-border-subtle bg-background p-6 sm:col-span-2 lg:col-span-3">
        <p className="mb-3 text-sm font-bold">{t('registrationsTotal')}</p>
        <ul className="flex flex-col gap-2">
          {Object.entries(byTrack)
            .sort(([, a], [, b]) => b - a)
            .map(([track, count]) => (
              <li key={track} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate">{track}</span>
                <span
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.max(4, (count / Math.max(1, registrations.length)) * 100)}%`,
                  }}
                  aria-hidden
                />
                <span className="ltr-nums text-muted">{count}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-background p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="ltr-nums mt-1 text-3xl font-extrabold text-primary">{value}</p>
    </div>
  )
}

export { Button }
