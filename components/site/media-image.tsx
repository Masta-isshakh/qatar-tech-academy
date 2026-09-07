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

  if (failed) {
    return (
      <div className={cn('relative h-full w-full', wrapperClassName)}>
        <ImagePlaceholder className="absolute inset-0" label={placeholderLabel} accent={accent} />
      </div>
    )
  }

  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />
}
