import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold leading-5',
  {
    variants: {
      variant: {
        neutral: 'bg-surface text-muted border border-border-subtle',
        brand: 'bg-maroon-soft text-primary border border-primary/20',
        success:
          'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
        warning:
          'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
        info: 'bg-sky-50 text-sky-900 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900',
        onMedia: 'bg-black/45 text-white backdrop-blur-sm border border-white/25',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
