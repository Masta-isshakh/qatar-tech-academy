'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Fade-and-rise on first scroll into view, once.
 *
 * The markup renders **visible**, and the hidden state is applied on the client
 * only to elements that are still below the fold at mount. An entrance animation
 * that starts from `opacity: 0` in the server HTML makes the browser's largest
 * contentful paint wait for hydration — that cost us 1.26s of LCP — and hides
 * content outright when JS is slow or blocked.
 */
export function FadeUp({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'li' | 'section'
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Already on screen: leave it painted, no animation, no LCP delay.
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.classList.add('qte-fade')
    el.style.transitionDelay = `${delay}s`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        el.classList.add('qte-fade-in')
        observer.disconnect()
      },
      { rootMargin: '0px 0px -80px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  // The union of tags is narrow and each accepts an element ref.
  const Comp = Tag as 'div'
  return (
    <Comp ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </Comp>
  )
}

/**
 * Subtle lift on hover for cards. CSS rather than a motion component: it costs
 * no JavaScript, and the global reduced-motion rule already neutralises it.
 */
export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className
      )}
    >
      {children}
    </div>
  )
}
