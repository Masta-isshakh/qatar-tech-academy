'use client'

import { useEffect, useState } from 'react'
import { amplifyOutputs, hasStorage } from './amplify'

let configured = false

/**
 * Public pages do not mount ConfigureAmplifyClientSide (it would put the whole
 * Amplify runtime in every page bundle), so the storage SDK is configured here,
 * lazily, the first time a video is actually requested. Without this the call
 * failed on production with "NoBucket: Missing bucket name".
 */
async function ensureConfigured() {
  if (configured) return
  const { Amplify } = await import('aws-amplify')
  if (!Amplify.getConfig().Storage) Amplify.configure(amplifyOutputs, { ssr: true })
  configured = true
}

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

    // Dynamic import: the storage SDK is large and only needed once a video is
    // actually requested.
    ensureConfigured()
      .then(() => import('aws-amplify/storage'))
      // validateObjectExistence: a video that has not been uploaded yet must
      // resolve to the poster/"unavailable" state, not a black player.
      .then(({ getUrl }) =>
        getUrl({ path, options: { expiresIn: 3600, validateObjectExistence: true } })
      )
      .then(({ url: signed }) => {
        if (cancelled) return
        setUrl(signed.toString())
        setState('ready')
      })
      .catch((error: unknown) => {
        // A not-yet-uploaded video is an expected state, not an error.
        const name = error instanceof Error ? error.name : ''
        if (name !== 'NotFound') console.error('[storage] getUrl failed', path, error)
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [path, enabled])

  return { url, state }
}
