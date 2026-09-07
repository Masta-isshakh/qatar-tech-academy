'use client'

import Script from 'next/script'
import { useEffect, useId, useRef, useState } from 'react'
import { site } from '@/lib/site'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Cloudflare Turnstile widget. Renders nothing when no site key is configured,
 * which is the current state — the honeypot in `components/ui/field.tsx` still
 * runs, and `lib/turnstile.ts` skips verification server-side to match.
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const containerId = useId().replace(/:/g, '')
  const rendered = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!site.turnstileSiteKey || !ready || rendered.current) return
    const turnstile = (window as any).turnstile
    if (!turnstile) return

    rendered.current = true
    turnstile.render(`#${containerId}`, {
      sitekey: site.turnstileSiteKey,
      callback: onToken,
      'expired-callback': () => onToken(''),
      'error-callback': () => onToken(''),
    })
  }, [ready, containerId, onToken])

  if (!site.turnstileSiteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onReady={() => setReady(true)}
      />
      <div id={containerId} />
    </>
  )
}
