'use client'

import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/amplify/data/resource'
import { isAmplifyConfigured } from './amplify'

let apiKeyClient: ReturnType<typeof generateClient<Schema>> | null = null
let userClient: ReturnType<typeof generateClient<Schema>> | null = null

/** Public client (API key): reads content, creates leads and registrations. */
export function publicClient() {
  if (!isAmplifyConfigured) return null
  apiKeyClient ??= generateClient<Schema>({ authMode: 'apiKey' })
  return apiKeyClient
}

/** Signed-in client (Cognito user pool): portal and admin. */
export function authedClient() {
  if (!isAmplifyConfigured) return null
  userClient ??= generateClient<Schema>({ authMode: 'userPool' })
  return userClient
}
