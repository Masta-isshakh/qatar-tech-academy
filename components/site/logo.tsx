import { cn } from '@/lib/utils'

/**
 * Inline wordmark. It is drawn rather than loaded so the header never waits on a
 * network round-trip; `public/images/logo.svg` replaces it once supplied.
 */
export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-xl font-black',
          onDark ? 'bg-white text-maroon' : 'bg-primary text-primary-foreground'
        )}
        style={{ fontFamily: 'var(--font-inter)' }}
      >
        Q
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-extrabold tracking-tight">أكاديمية قطر للتقنية</span>
        <span
          className={cn('text-[0.65rem] font-semibold tracking-[0.14em] uppercase', onDark ? 'text-white/70' : 'text-muted')}
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Qatar Tech Education
        </span>
      </span>
    </span>
  )
}
