'use client'

import { Amplify } from 'aws-amplify'
import { amplifyOutputs, isAmplifyConfigured } from '@/lib/amplify'

// Configured at module scope so it runs once, before any child effect fires.
if (isAmplifyConfigured) {
  Amplify.configure(amplifyOutputs, { ssr: true })
}

/**
 * Renders nothing; its only job is to run `Amplify.configure` on the client.
 * Mounted from the locale layout.
 */
export function ConfigureAmplifyClientSide() {
  return null
}
