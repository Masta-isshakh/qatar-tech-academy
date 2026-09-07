'use client'

import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { site } from '@/lib/site'

const STORAGE_KEY = 'qte.cookie-consent'

type Consent = 'granted' | 'denied' | 'unknown'

type ConsentContextValue = {
  consent: Consent
  setConsent: (value: 'granted' | 'denied') => void
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: 'unknown',
  setConsent: () => {},
})

export function useCookieConsent() {
  return useContext(ConsentContext)
}

/**
 * Nothing analytics-related is requested until the visitor accepts. GA4 and the
 * Meta Pixel are mounted only once `consent === 'granted'`, which also keeps
 * them off the critical path for the Lighthouse run.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<Consent>('unknown')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'granted' || stored === 'denied') setConsentState(stored)
    } catch {
      // Private mode or blocked storage — stay at 'unknown' and ask again.
    }
  }, [])

  const setConsent = useCallback((value: 'granted' | 'denied') => {
    setConsentState(value)
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(() => ({ consent, setConsent }), [consent, setConsent])
  const enabled = consent === 'granted'

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {enabled && site.analytics.ga4 ? <GoogleAnalytics gaId={site.analytics.ga4} /> : null}
      {enabled && site.analytics.metaPixel ? (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${site.analytics.metaPixel}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </ConsentContext.Provider>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Fires a conversion event on both GA4 and the Pixel, if either is loaded. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const w = window as any
  try {
    w.gtag?.('event', name, params)
    w.fbq?.('trackCustom', name, params)
  } catch {
    /* analytics must never break the UI */
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
