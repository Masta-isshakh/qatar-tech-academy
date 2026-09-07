import * as React from 'react'
import { CheckCircle2, MapPin, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FadeUp } from './motion'
import { MediaImage } from './media-image'

/* ------------------------------------------------------------------ stats */

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-border-subtle bg-background flex flex-col gap-1 rounded-2xl border p-6 text-center">
      <span className="text-primary text-3xl font-extrabold md:text-4xl">{value}</span>
      <span className="text-muted text-sm">{label}</span>
    </div>
  )
}

/* --------------------------------------------------------------- timeline */

export function Timeline({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="relative grid gap-6 md:grid-cols-3">
      {steps.map((step, i) => (
        <FadeUp as="li" key={step.title} delay={i * 0.05}>
          <div className="border-border-subtle bg-background flex h-full flex-col gap-2 rounded-2xl border p-6">
            <span
              className="ltr-nums bg-maroon-soft text-primary grid size-9 place-items-center rounded-full text-sm font-extrabold"
              aria-hidden
            >
              {i + 1}
            </span>
            <h3 className="text-lg">{step.title}</h3>
            <p className="text-muted text-sm">{step.body}</p>
          </div>
        </FadeUp>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------- pillar card */

export function PillarCard({ title, body, index }: { title: string; body: string; index: number }) {
  return (
    <FadeUp delay={index * 0.06} className="h-full">
      <div className="border-border-subtle bg-background flex h-full flex-col gap-3 rounded-2xl border p-7">
        <CheckCircle2 className="text-primary size-7" aria-hidden />
        <h3 className="text-xl">{title}</h3>
        <p className="text-muted">{body}</p>
      </div>
    </FadeUp>
  )
}

/* ------------------------------------------------------------ testimonial */

export function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string
  name: string
  role: string
}) {
  return (
    <figure className="border-border-subtle bg-background flex h-full flex-col gap-4 rounded-2xl border p-7">
      <Quote className="text-primary/40 size-7" aria-hidden />
      <blockquote className="flex-1 text-lg leading-relaxed">{quote}</blockquote>
      <figcaption className="text-sm">
        <span className="font-bold">{name}</span>
        <span className="text-muted block">{role}</span>
      </figcaption>
    </figure>
  )
}

/* ----------------------------------------------------------------- marquee */

/**
 * Duplicated track so the CSS translate loops seamlessly. Marked
 * `aria-hidden` on the copy so screen readers announce each name once.
 */
export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] py-2">
      <div className="marquee-track flex w-max gap-3 hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex gap-3" aria-hidden={copy === 1}>
            {items.map((name) => (
              <li
                key={`${copy}-${name}`}
                className="border-border-subtle bg-background text-muted rounded-full border px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
              >
                {name}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- badges */

export function CertificationBadge({
  name,
  body,
  examPriceUsd,
  examOnSite,
  onSiteLabel,
  priceLabel,
  usdLabel,
}: {
  name: string
  body: string
  examPriceUsd: number
  examOnSite: boolean
  onSiteLabel: string
  priceLabel: string
  usdLabel: string
}) {
  return (
    <div className="border-border-subtle bg-background flex flex-col gap-2 rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-bold">{name}</h3>
        {body ? <Badge variant="neutral">{body}</Badge> : null}
      </div>
      <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {examPriceUsd > 0 ? (
          <span className="ltr-nums">
            {priceLabel}: {usdLabel} {examPriceUsd}
          </span>
        ) : null}
        {examOnSite ? (
          <span className="text-primary inline-flex items-center gap-1.5 font-semibold">
            <MapPin className="size-4" aria-hidden />
            {onSiteLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- trainer */

export function TrainerCard({
  name,
  title,
  bio,
  credentials,
  photoKey,
  country,
}: {
  name: string
  title: string
  bio: string
  credentials: string[]
  photoKey: string
  country: string
}) {
  return (
    <div className="border-border-subtle bg-background flex h-full flex-col gap-3 rounded-2xl border p-6">
      <div className="relative size-20 overflow-hidden rounded-full">
        <MediaImage
          src={photoKey || '/images/team/placeholder.jpg'}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div>
        <h3 className="text-lg">{name}</h3>
        <p className="text-muted text-sm">
          {title}
          {country ? ` · ${country}` : ''}
        </p>
      </div>
      {bio ? <p className="text-muted text-sm">{bio}</p> : null}
      {credentials.length ? (
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {credentials.map((c) => (
            <li key={c}>
              <Badge variant="brand">{c}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------ lab gallery */

export function LabGallery({
  items,
  captions,
}: {
  items: readonly { src: string; span: string }[]
  captions: string[]
}) {
  const spanClass = (span: string) =>
    span === 'tall'
      ? 'sm:row-span-2 aspect-[3/4]'
      : span === 'wide'
        ? 'sm:col-span-2 aspect-[16/9]'
        : 'aspect-[4/3]'

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <FadeUp
          as="li"
          key={item.src + i}
          delay={i * 0.04}
          className={cn('relative', spanClass(item.span))}
        >
          <figure className="group relative h-full w-full overflow-hidden rounded-2xl">
            <MediaImage
              src={item.src}
              alt={captions[i] ?? ''}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              placeholderLabel={captions[i]}
            />
            <figcaption className="from-charcoal/85 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-4 text-sm font-semibold text-white">
              {captions[i] ?? ''}
            </figcaption>
          </figure>
        </FadeUp>
      ))}
    </ul>
  )
}
