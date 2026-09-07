'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { MediaImage } from './media-image'
import { VideoPlayer } from './video-player'
import { trackEvent } from '@/components/providers/analytics'

const AUTOPLAY_MS = 6000

type Slide = {
  image: string
  imageAr: string
  accent: string
  primary: { kind: 'link'; href: string } | { kind: 'video' }
  secondary: { kind: 'link'; href: string } | { kind: 'video' }
}

const SLIDES: Slide[] = [
  {
    image: '/images/hero/hero-1.jpg',
    imageAr: '/images/hero/hero-1-ar.jpg',
    accent: '#8A1538',
    primary: { kind: 'link', href: '/register' },
    secondary: { kind: 'video' },
  },
  {
    image: '/images/hero/hero-2.jpg',
    imageAr: '/images/hero/hero-2-ar.jpg',
    accent: '#1FA2FF',
    primary: { kind: 'link', href: '/tracks/robotics' },
    secondary: { kind: 'link', href: '/tracks' },
  },
  {
    image: '/images/hero/hero-3.jpg',
    imageAr: '/images/hero/hero-3-ar.jpg',
    accent: '#222222',
    primary: { kind: 'link', href: '/tracks/cybersecurity' },
    secondary: { kind: 'link', href: '/tracks' },
  },
]

type SlideCopy = { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string }

export function HeroSlider({ heroVideoKey }: { heroVideoKey?: string }) {
  const t = useTranslations('home.hero')
  const locale = useLocale()
  const reduced = useReducedMotion()
  const copy = t.raw('slides') as SlideCopy[]

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((next: number) => setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    // Autoplay is a convenience, not the only way through — arrows, dots and
    // keyboard all work, and reduced-motion users get a static first slide.
    if (paused || reduced || videoOpen) return
    timer.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [paused, reduced, videoOpen])

  const slide = SLIDES[index]
  const text = copy[index] ?? copy[0]
  const image = locale === 'ar' ? slide.imageAr : slide.image

  function renderCta(
    action: Slide['primary'],
    label: string,
    variant: 'primary' | 'outlineOnMedia'
  ) {
    if (action.kind === 'video') {
      return (
        <Button
          variant={variant}
          size="lg"
          onClick={() => {
            setVideoOpen(true)
            trackEvent('hero_video_open')
          }}
        >
          {label}
        </Button>
      )
    }
    return (
      <Button asChild variant={variant} size="lg">
        <Link href={action.href}>{label}</Link>
      </Button>
    )
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={text.title}
      className="relative isolate overflow-hidden bg-charcoal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goTo(index + (locale === 'ar' ? -1 : 1))
        if (e.key === 'ArrowLeft') goTo(index + (locale === 'ar' ? 1 : -1))
      }}
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[42rem]">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.8, ease: 'easeInOut' }}
          >
            <MediaImage
              src={image}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              quality={80}
              className="object-cover"
              accent={slide.accent}
            />
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/20"
        />

        <div className="container-site relative flex h-full flex-col justify-end pb-14 md:justify-center md:pb-0">
          <div aria-live="polite" aria-atomic className="max-w-2xl text-white">
            <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">{text.title}</h1>
            <p className="mt-4 text-base text-white/85 sm:text-lg">{text.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {renderCta(slide.primary, text.ctaPrimary, 'primary')}
              {renderCta(slide.secondary, text.ctaSecondary, 'outlineOnMedia')}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 start-0 w-full">
          <div className="container-site flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? t('playAutoplay') : t('pauseAutoplay')}
              className="grid size-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
            >
              {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            </button>
            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t('goToSlide', { number: i + 1 })}
                  aria-current={i === index}
                  className={
                    i === index
                      ? 'h-2 w-8 rounded-full bg-white transition-all'
                      : 'h-2 w-2 rounded-full bg-white/45 transition-all hover:bg-white/70'
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent closeLabel={t('pauseAutoplay')} className="p-2">
          <DialogTitle className="sr-only">{text.title}</DialogTitle>
          <VideoPlayer
            storageKey={heroVideoKey}
            posterAlt={text.title}
            eager
            className="aspect-video w-full"
          />
        </DialogContent>
      </Dialog>
    </section>
  )
}
