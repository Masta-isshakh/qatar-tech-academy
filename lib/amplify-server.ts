import 'server-only'

import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { createServerRunner } from '@aws-amplify/adapter-nextjs'
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data'
import { cookies } from 'next/headers'
import { fetchAuthSession } from 'aws-amplify/auth/server'
import type { Schema } from '@/amplify/data/resource'
import { amplifyOutputs, isAmplifyConfigured, ADMIN_GROUP } from './amplify'

export const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyOutputs,
})

// Configured once per server process so the public client below works outside
// a request (ISR, generateStaticParams, sitemap).
if (isAmplifyConfigured) {
  Amplify.configure(amplifyOutputs, { ssr: true })
}

/**
 * Server client for public content, authenticated with the API key.
 *
 * Deliberately NOT the cookie-based client: that one may only be used inside a
 * request scope, and calling it during static/ISR rendering throws ("`cookies`
 * was called outside a request scope"), which silently sent every public page
 * back to the seed content. The API key needs no request context, so this
 * client is safe in `generateStaticParams`, ISR revalidation, `sitemap.ts` and
 * Server Actions alike.
 */
export const publicServerClient = generateClient<Schema>({ authMode: 'apiKey' })

/**
 * Server client that runs as the signed-in user (portal and admin reads).
 * Cookie-based, so only valid inside a request — never in static rendering.
 */
export const userServerClient = generateServerClientUsingCookies<Schema>({
  config: amplifyOutputs,
  cookies,
  authMode: 'userPool',
})

export type ServerSession = {
  isSignedIn: boolean
  email: string | null
  groups: string[]
  isAdmin: boolean
}

const SIGNED_OUT: ServerSession = { isSignedIn: false, email: null, groups: [], isAdmin: false }

/** Reads the Cognito session from the request cookies. Never throws. */
export async function getServerSession(): Promise<ServerSession> {
  if (!isAmplifyConfigured) return SIGNED_OUT

  try {
    return await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const session = await fetchAuthSession(contextSpec)
        const payload = session.tokens?.idToken?.payload
        if (!payload) return SIGNED_OUT

        const raw = payload['cognito:groups']
        const groups = Array.isArray(raw) ? raw.map(String) : []
        const email = typeof payload.email === 'string' ? payload.email : null

        return { isSignedIn: true, email, groups, isAdmin: groups.includes(ADMIN_GROUP) }
      },
    })
  } catch {
    return SIGNED_OUT
  }
}
