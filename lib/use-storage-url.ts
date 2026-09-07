'use client'

import { useEffect, useState } from 'react'
import { getUrl } from 'aws-amplify/storage'
import { hasStorage } from './amplify'

/**
 * Resolves a signed URL for an S3 object.
 *
 * Amplify grants `public/*` read access through the Cognito guest role rather
 * than a public bucket policy, so even "public" media needs a signed URL. Videos
 * resolve lazily — when a modal opens or a player mounts — so nothing is
 * requested on first paint.
 */
export function useStorageUrl(path: string | null | undefined, enabled = true) {
  const [url, setUrl] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    if (!enabled || !path || !hasStorage) {
      setState(path && enabled ? 'error' : 'idle')
      return
    }

    let cancelled = false
    setState('loading')

    getUrl({ path, options: { expiresIn: 3600 } })
      .then(({ url: signed }) => {
        if (cancelled) return
        setUrl(signed.toString())
        setState('ready')
      })
      .catch((error) => {
        console.error('[storage] getUrl failed', path, error)
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [path, enabled])

  return { url, state }
}
