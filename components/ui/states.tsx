import * as React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xl bg-surface', className)}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-subtle p-4">
      <Skeleton className="mb-4 aspect-video w-full" />
      <Skeleton className="mb-2 h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string
  body?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-surface/60 px-6 py-12 text-center">
      {icon ? <div className="text-muted">{icon}</div> : null}
      <p className="font-bold">{title}</p>
      {body ? <p className="max-w-prose text-sm text-muted">{body}</p> : null}
      {action}
    </div>
  )
}
