'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Play, Volume2, VolumeX } from 'lucide-react'
import { useStorageUrl } from '@/lib/use-storage-url'
import { MediaImage } from './media-image'
import { cn } from '@/lib/utils'

/**
 * Lazy MP4/HLS player. The source is only requested once the player is in view
 * (or the caller sets `eager`), so hero video never competes with LCP.
 */
export function VideoPlayer({
  storageKey,
  src,
  poster,
  posterAlt,
  accent,
  autoPlayMuted = false,
  className,
  eager = false,
}: {
  storageKey?: string
  src?: string
  poster?: string
  posterAlt: string
  accent?: string
  autoPlayMuted?: boolean
  className?: string
  eager?: boolean
}) {
  const t = useTranslations('home.hero')
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(eager)
  const [muted, setMuted] = useState(true)
  const [started, setStarted] = useState(autoPlayMuted)

  const { url, state } = useStorageUrl(storageKey, inView && !src)
  const source = src ?? url

  useEffect(() => {
    if (inView || !containerRef.current) return
    const el = containerRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])

  const unavailable = !source && (state === 'error' || (!storageKey && !src))

  return (
    <div
      ref={containerRef}
      className={cn('bg-charcoal relative overflow-hidden rounded-2xl', className)}
    >
      {source ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={source}
          poster={poster}
          muted={muted}
          autoPlay={autoPlayMuted}
          loop={autoPlayMuted}
          playsInline
          controls={started && !autoPlayMuted}
          preload="metadata"
        />
      ) : (
        <>
          {poster ? (
            <MediaImage
              src={poster}
              alt={posterAlt}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
              accent={accent}
            />
          ) : null}
          <div className="bg-charcoal/40 absolute inset-0 grid place-items-center text-white">
            {unavailable ? (
              <p className="px-6 text-center text-sm">{t('videoUnavailable')}</p>
            ) : (
              <Play className="size-12" aria-hidden />
            )}
          </div>
        </>
      )}

      {source && autoPlayMuted ? (
        <button
          type="button"
          onClick={() => {
            setMuted((m) => !m)
            setStarted(true)
            void videoRef.current?.play()
          }}
          className="absolute end-3 bottom-3 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? (
            <VolumeX className="size-5" aria-hidden />
          ) : (
            <Volume2 className="size-5" aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  )
}
