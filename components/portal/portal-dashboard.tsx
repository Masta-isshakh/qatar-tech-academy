'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { CalendarCheck, Download, FileBadge, MapPin } from 'lucide-react'

import { Link } from '@/i18n/routing'
import { authedClient } from '@/lib/amplify-client'
import { hasStorage } from '@/lib/amplify'
import { formatDate, formatDateTime, pick } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ListSkeleton, Skeleton } from '@/components/ui/states'
import { LessonLibrary } from './lesson-library'

type Registration = {
  id: string
  name: string
  status: string | null
  trackSlug: string | null
  testScore: number | null
}

type Appointment = {
  id: string
  slotStart: string | null
  slotEnd: string | null
  room: string | null
  status: string | null
}

type Enrollment = {
  id: string
  trackId: string
  cohortId: string | null
  status: string | null
  certificateKey: string | null
}

type PortalData = {
  registration: Registration | null
  appointment: Appointment | null
  enrollments: Enrollment[]
}

const STATUS_ORDER = ['APPLIED', 'TEST_SCHEDULED', 'TESTED', 'SELECTED', 'ENROLLED'] as const

export function PortalDashboard({ locale, email }: { locale: string; email?: string }) {
  const t = useTranslations('portal')
  const tc = useTranslations('common')
  const { signOut } = useAuthenticator((ctx) => [ctx.user])

  const [data, setData] = useState<PortalData | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [announcements, setAnnouncements] = useState<
    { id: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; publishedAt: string | null }[]
  >([])

  const load = useCallback(async () => {
    const client = authedClient()
    if (!client) {
      setState('error')
      return
    }

    setState('loading')
    try {
      const [portal, announcementList] = await Promise.all([
        client.queries.myPortal(),
        client.models.Announcement.list({ filter: { isPublished: { eq: true } }, limit: 10 }),
      ])

      const raw = portal.data
      const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as PortalData | null
      setData(parsed ?? { registration: null, appointment: null, enrollments: [] })

      setAnnouncements(
        (announcementList.data ?? [])
          .map((a) => ({
            id: a.id,
            titleEn: a.titleEn ?? '',
            titleAr: a.titleAr ?? '',
            bodyEn: a.bodyEn ?? '',
            bodyAr: a.bodyAr ?? '',
            publishedAt: a.publishedAt ?? null,
          }))
          .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
      )
      setState('ready')
    } catch (err) {
      console.error('[portal] load failed', err)
      setState('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const registration = data?.registration ?? null
  const currentIndex = registration?.status
    ? STATUS_ORDER.indexOf(registration.status as (typeof STATUS_ORDER)[number])
    : -1

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t('title')}</h1>
          <p className="ltr-nums text-sm text-muted">
            {t('welcome')}
            {email ? ` · ${email}` : ''}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={signOut}>
          {t('signOut')}
        </Button>
      </header>

      {state === 'error' ? (
        <EmptyState
          title={tc('error')}
          body={tc('errorBody')}
          action={
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              {tc('retry')}
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registration status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statusTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'loading' ? (
              <ListSkeleton rows={2} />
            ) : registration ? (
              <ol className="flex flex-col gap-3">
                {STATUS_ORDER.map((status, i) => {
                  const reached = currentIndex >= i
                  return (
                    <li key={status} className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={
                          reached
                            ? 'size-3 shrink-0 rounded-full bg-primary'
                            : 'size-3 shrink-0 rounded-full border border-border-subtle'
                        }
                      />
                      <span className={reached ? 'font-semibold' : 'text-muted'}>
                        {t(`statusSteps.${status}`)}
                      </span>
                      {registration.status === status ? (
                        <Badge variant="brand" className="ms-auto">
                          {t(`statusSteps.${status}`)}
                        </Badge>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            ) : (
              <EmptyState
                title={t('statusEmpty')}
                action={
                  <Button asChild size="sm">
                    <Link href="/register">{t('browseTracks')}</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Next appointment */}
        <Card>
          <CardHeader>
            <CardTitle>{t('appointmentTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'loading' ? (
              <Skeleton className="h-16 w-full" />
            ) : data?.appointment?.slotStart ? (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2">
                  <CalendarCheck className="size-4 shrink-0 text-primary" aria-hidden />
                  {formatDateTime(data.appointment.slotStart, locale)}
                </p>
                {data.appointment.room ? (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <MapPin className="size-4 shrink-0" aria-hidden />
                    {data.appointment.room}
                  </p>
                ) : null}
                <Badge variant="info" className="self-start">
                  {data.appointment.status ?? ''}
                </Badge>
              </div>
            ) : (
              <EmptyState title={t('appointmentEmpty')} />
            )}
          </CardContent>
        </Card>

        {/* Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle>{t('enrollmentsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'loading' ? (
              <ListSkeleton rows={2} />
            ) : data?.enrollments.length ? (
              <ul className="flex flex-col gap-3">
                {data.enrollments.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3">
                    <span className="ltr-nums text-sm font-semibold">{e.cohortId ?? e.trackId}</span>
                    <Badge variant="neutral">{e.status ?? ''}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={t('enrollmentsEmpty')}
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/tracks">{t('browseTracks')}</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>{t('certificatesTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'loading' ? (
              <ListSkeleton rows={1} />
            ) : (
              <CertificateList
                keys={(data?.enrollments ?? [])
                  .map((e) => e.certificateKey)
                  .filter((k): k is string => Boolean(k))}
                emptyLabel={t('certificatesEmpty')}
                downloadLabel={t('download')}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lessons */}
      <section>
        <h2 className="mb-4 text-2xl">{t('lessonsTitle')}</h2>
        <LessonLibrary locale={locale} emptyLabel={t('lessonsEmpty')} />
      </section>

      {/* Announcements */}
      <section>
        <h2 className="mb-4 text-2xl">{t('announcementsTitle')}</h2>
        {state === 'loading' ? (
          <ListSkeleton rows={2} />
        ) : announcements.length === 0 ? (
          <EmptyState title={t('announcementsEmpty')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-2xl border border-border-subtle bg-background p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold">{pick(locale, a.titleEn, a.titleAr)}</h3>
                  <span className="text-xs text-muted">{formatDate(a.publishedAt, locale)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{pick(locale, a.bodyEn, a.bodyAr)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function CertificateList({
  keys,
  emptyLabel,
  downloadLabel,
}: {
  keys: string[]
  emptyLabel: string
  downloadLabel: string
}) {
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!hasStorage || keys.length === 0) return
    let cancelled = false

    void (async () => {
      const { getUrl } = await import('aws-amplify/storage')
      const entries = await Promise.all(
        keys.map(async (key) => {
          try {
            const { url } = await getUrl({ path: key, options: { expiresIn: 900 } })
            return [key, url.toString()] as const
          } catch (err) {
            console.error('[portal] certificate url failed', key, err)
            return null
          }
        })
      )
      if (!cancelled) {
        setUrls(Object.fromEntries(entries.filter(Boolean) as (readonly [string, string])[]))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [keys])

  if (keys.length === 0) return <EmptyState title={emptyLabel} />

  return (
    <ul className="flex flex-col gap-2">
      {keys.map((key) => (
        <li key={key} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm">
            <FileBadge className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="ltr-nums truncate">{key.split('/').pop()}</span>
          </span>
          <Button asChild size="sm" variant="secondary" disabled={!urls[key]}>
            <a href={urls[key] ?? '#'} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" aria-hidden />
              {downloadLabel}
            </a>
          </Button>
        </li>
      ))}
    </ul>
  )
}
