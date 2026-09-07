import outputs from '@/amplify_outputs.json'

type Outputs = typeof outputs & {
  _placeholder?: boolean
  data?: { url?: string; api_key?: string; aws_region?: string }
  auth?: { user_pool_id?: string }
  storage?: { bucket_name?: string }
}

export const amplifyOutputs = outputs as Outputs

/**
 * True once a real backend exists. When false (fresh clone, no sandbox yet) the
 * public pages read `data/seed-content.ts` and write paths are disabled rather
 * than throwing at request time.
 */
export const isAmplifyConfigured = Boolean(
  !amplifyOutputs._placeholder && amplifyOutputs.data?.url
)

export const hasAuth = isAmplifyConfigured && Boolean(amplifyOutputs.auth?.user_pool_id)
export const hasStorage = isAmplifyConfigured && Boolean(amplifyOutputs.storage?.bucket_name)

export const ADMIN_GROUP = 'Admins'
