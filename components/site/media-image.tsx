'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import manifest from '@/data/image-manifest.json'

type ManifestEntry = { width: number; height: number; blurDataURL: string }
const MANIFEST = manifest as Record<string, ManifestEntry>

/**
 * A maroon-on-sand placeholder used until the real photography is uploaded to
 * `public/images/…`. It also covers a broken or missing file in production, so a
 * missing asset degrades to a branded panel instead of an empty box.
 */
export function ImagePlaceholder({
  className,
  label,
  accent = '#8A1538',
}: {
  className?: string
  label?: string
  accent?: string
}) {
  return (
    <div
      aria-hidden
      className={cn('bg-sand-light dark:bg-charcoal-soft relative overflow-hidden', className)}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 15% 10%, ${accent}22 0%, transparent 60%), repeating-linear-gradient(135deg, ${accent}0f 0 12px, transparent 12px 24px)`,
      }}
    >
      <span
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      {label ? (
        <span className="text-muted absolute inset-0 flex items-center justify-center px-6 text-center text-xs font-semibold tracking-wide uppercase">
          {label}
        </span>
      ) : null}
    </div>
  )
}

type MediaImageProps = Omit<ImageProps, 'onError' | 'alt'> & {
  alt: string
  accent?: string
  placeholderLabel?: string
  wrapperClassName?: string
}

/**
 * next/image plus two things it does not do on its own:
 *
 * 1. Every file produced by `npm run images` has a 20px blur in
 *    `data/image-manifest.json`. It is inlined as `blurDataURL`, so the frame is
 *    painted with the photo's colours on the first frame — before a single byte
 *    of the real image has arrived — and the real image fades in over it.
 * 2. A branded placeholder is rendered on the server behind `fill` images, so
 *    a path that does not exist yet still shows something designed, not a hole.
 */
export function MediaImage({
  alt,
  accent,
  placeholderLabel,
  wrapperClassName,
  className,
  ...props
}: MediaImageProps) {
  const [failed, setFailed] = useState(false)
  const src = typeof props.src === 'string' ? props.src : undefined
  const meta = src ? MANIFEST[src] : undefined
  const blur = meta ? { placeholder: 'blur' as const, blurDataURL: meta.blurDataURL } : {}
  // `public/images/…` paths are produced by `npm run images`, so one that is not
  // in the manifest does not exist. Skip the request rather than 400 the
  // optimiser and log a console error on every page view. Remote and storage
  // URLs (admin uploads) are always attempted.
  const knownMissing = Boolean(src && src.startsWith('/images/') && !meta)

  if (props.fill) {
    return (
      <>
        {meta ? null : (
          <ImagePlaceholder
            className={cn('absolute inset-0', wrapperClassName)}
            label={placeholderLabel}
            accent={accent}
          />
        )}
        {knownMissing ? null : (
          <Image
            alt={alt}
            className={className}
            {...blur}
            // Direct DOM write rather than setState: there is nothing to re-render.
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
            {...props}
          />
        )}
      </>
    )
  }

  if (failed || knownMissing) {
    return (
      <ImagePlaceholder
        className={cn(wrapperClassName, className)}
        label={placeholderLabel}
        accent={accent}
      />
    )
  }

  return (
    <Image
      alt={alt}
      className={className}
      width={props.width ?? meta?.width}
      height={props.height ?? meta?.height}
      {...blur}
      onError={() => setFailed(true)}
      {...props}
    />
  )
}
