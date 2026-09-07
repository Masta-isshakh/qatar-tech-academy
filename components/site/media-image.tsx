'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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

export function MediaImage({
  alt,
  accent,
  placeholderLabel,
  wrapperClassName,
  className,
  ...props
}: MediaImageProps) {
  const [failed, setFailed] = useState(false)

  // With `fill`, the caller already provides a positioned box, so the
  // placeholder can sit behind the image and be painted on the server. That
  // gives the page a real LCP candidate on first paint instead of waiting for
  // hydration to swap in a fallback, and removes the flash of empty box.
  if (props.fill) {
    return (
      <>
        <ImagePlaceholder
          className={cn('absolute inset-0', wrapperClassName)}
          label={placeholderLabel}
          accent={accent}
        />
        <Image
          alt={alt}
          className={className}
          // Direct DOM write rather than setState: the placeholder behind is
          // already painted, so there is nothing to re-render.
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
          {...props}
        />
      </>
    )
  }

  if (failed) {
    return (
      <ImagePlaceholder
        className={cn(wrapperClassName, className)}
        label={placeholderLabel}
        accent={accent}
      />
    )
  }

  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />
}
