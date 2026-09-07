'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CirclePlay, CircleCheck } from 'lucide-react'

import { authedClient } from '@/lib/amplify-client'
import { useStorageUrl } from '@/lib/use-storage-url'
import { pick, cn } from '@/lib/utils'
import { EmptyState, ListSkeleton } from '@/components/ui/states'

const SAVE_EVERY_SECONDS = 10

type Lesson = {
  id: string
  titleEn: string
  titleAr: string
  videoKey: string | null
  durationSeconds: number | null
  order: number
}

type Progress = { id: string; lessonId: string; seconds: number; completed: boolean }

export function LessonLibrary({ locale, emptyLabel }: { locale: string; emptyLabel: string }) {
  const t = useTranslations('portal')
  const [lessons, setLessons] = useState<Lesson[] | null>(null)
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const client = authedClient()
    if (!client) {
      setLessons([])
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const [lessonList, progressList] = await Promise.all([
          client.models.Lesson.list({ limit: 200 }),
          client.models.LessonProgress.list({ limit: 200 }),
        ])
        if (cancelled) return

        setLessons(
          (lessonList.data ?? [])
            .map((l) => ({
              id: l.id,
              titleEn: l.titleEn ?? '',
              titleAr: l.titleAr ?? '',
              videoKey: l.videoKey ?? null,
              durationSeconds: l.durationSeconds ?? null,
              order: l.order ?? 0,
            }))
            .sort((a, b) => a.order - b.order)
        )

        setProgress(
          Object.fromEntries(
            (progressList.data ?? []).map((p) => [
              p.lessonId,
              {
                id: p.id,
                lessonId: p.lessonId,
                seconds: p.seconds ?? 0,
                completed: Boolean(p.completed),
              },
            ])
          )
        )
      } catch (err) {
        console.error('[portal] lessons failed', err)
        if (!cancelled) setLessons([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const saveProgress = useCallback(
    async (lessonId: string, seconds: number, completed: boolean) => {
      const client = authedClient()
      if (!client) return

      const existing = progress[lessonId]
      try {
        if (existing) {
          await client.models.LessonProgress.update({
            id: existing.id,
            seconds,
            completed: completed || existing.completed,
          })
        } else {
          const { data } = await client.models.LessonProgress.create({ lessonId, seconds, completed })
          if (data) {
            setProgress((p) => ({
              ...p,
              [lessonId]: { id: data.id, lessonId, seconds, completed },
            }))
            return
          }
        }
        setProgress((p) => ({
          ...p,
          [lessonId]: {
            id: existing?.id ?? lessonId,
            lessonId,
            seconds,
            completed: completed || Boolean(existing?.completed),
          },
        }))
      } catch (err) {
        console.error('[portal] saveProgress failed', err)
      }
    },
    [progress]
  )

  if (lessons === null) return <ListSkeleton rows={3} />
  if (lessons.length === 0) return <EmptyState title={emptyLabel} />

  const active = lessons.find((l) => l.id === activeId) ?? null

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div>
        {active ? (
          <LessonPlayer
            key={active.id}
            lesson={active}
            locale={locale}
            startAt={progress[active.id]?.seconds ?? 0}
            onProgress={saveProgress}
          />
        ) : (
          <EmptyState title={t('lessonsTitle')} body={t('resume')} />
        )}
      </div>

      <ul className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto rounded-2xl border border-border-subtle p-2">
        {lessons.map((lesson) => {
          const p = progress[lesson.id]
          return (
            <li key={lesson.id}>
              <button
                type="button"
                onClick={() => setActiveId(lesson.id)}
                aria-current={lesson.id === activeId}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm transition-colors',
                  lesson.id === activeId ? 'bg-maroon-soft font-semibold' : 'hover:bg-surface'
                )}
              >
                {p?.completed ? (
                  <CircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <CirclePlay className="size-4 shrink-0 text-muted" aria-hidden />
                )}
                <span className="flex-1 truncate">{pick(locale, lesson.titleEn, lesson.titleAr)}</span>
                {p && !p.completed && p.seconds > 0 ? (
                  <span className="ltr-nums shrink-0 text-xs text-muted">{t('resume')}</span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function LessonPlayer({
  lesson,
  locale,
  startAt,
  onProgress,
}: {
  lesson: Lesson
  locale: string
  startAt: number
  onProgress: (lessonId: string, seconds: number, completed: boolean) => void
}) {
  const t = useTranslations('portal')
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSaved = useRef(0)
  const { url, state } = useStorageUrl(lesson.videoKey)

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-charcoal">
        {url ? (
          <video
            ref={videoRef}
            src={url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
            onLoadedMetadata={() => {
              // Resume where the learner left off.
              if (videoRef.current && startAt > 0) videoRef.current.currentTime = startAt
            }}
            onTimeUpdate={(e) => {
              const seconds = Math.floor(e.currentTarget.currentTime)
              if (seconds - lastSaved.current >= SAVE_EVERY_SECONDS) {
                lastSaved.current = seconds
                onProgress(lesson.id, seconds, false)
              }
            }}
            onEnded={() => onProgress(lesson.id, Math.floor(videoRef.current?.duration ?? 0), true)}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-white/70">
            {state === 'loading' ? t('resume') : t('lessonsEmpty')}
          </div>
        )}
      </div>
      <figcaption className="font-bold">{pick(locale, lesson.titleEn, lesson.titleAr)}</figcaption>
    </figure>
  )
}
