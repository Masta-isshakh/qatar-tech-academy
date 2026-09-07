import * as React from 'react'
import { cn } from '@/lib/utils'
import { FadeUp } from './motion'

export function Section({
  children,
  className,
  tone = 'default',
  id,
}: {
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'surface' | 'brand'
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'py-16 md:py-24',
        tone === 'surface' && 'bg-surface',
        tone === 'brand' && 'bg-maroon text-white',
        className
      )}
    >
      <div className="container-site">{children}</div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'start',
  className,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'start' | 'center'
  className?: string
  action?: React.ReactNode
}) {
  return (
    <FadeUp
      className={cn(
        'mb-10 flex flex-col gap-3 md:mb-14',
        align === 'center' && 'items-center text-center',
        action && 'md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className={cn('flex flex-col gap-3', align === 'center' && 'items-center')}>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        ) : null}
        <h2 className="max-w-3xl text-3xl md:text-4xl">{title}</h2>
        {subtitle ? <p className="max-w-2xl text-lg text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </FadeUp>
  )
}
