'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Fade-and-rise on first scroll into view, once. Respects the OS
 * "reduce motion" setting by rendering the final state immediately.
 */
export function FadeUp({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'li' | 'section'
}) {
  const reduced = useReducedMotion()
  const Comp = motion[as]

  if (reduced) {
    const Static = as
    return <Static className={className}>{children}</Static>
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  )
}

/** Subtle lift on hover for cards. No bounce, no scale on tap. */
export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      whileHover={{ y: -4 }}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
