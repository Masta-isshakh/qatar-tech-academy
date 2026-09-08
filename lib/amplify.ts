import outputs from '@/amplify_outputs.json'

type Outputs = typeof outputs & {
  _placeholder?: boolean
  data?: {
    url?: string
    api_key?: string
    aws_region?: string
    model_introspection?: { models?: Record<string, unknown> }
  }
  auth?: { user_pool_id?: string }
  storage?: { bucket_name?: string }
}

export const amplifyOutputs = outputs as Outputs

const hasDataEndpoint = Boolean(!amplifyOutputs._placeholder && amplifyOutputs.data?.url)

/**
 * The outputs file must describe *this* repo's backend. An `amplify_outputs.json`
 * copied from another app (the Todo starter, say) has a data endpoint but none
 * of our models, and every query would throw at request time. Fingerprint a
 * couple of models so a mismatched file behaves like a missing one: the site
 * renders from seed content and the forms stay disabled.
 */
const models = amplifyOutputs.data?.model_introspection?.models ?? {}
const matchesSchema = 'Track' in models && 'Registration' in models && 'TestSlot' in models

/** The backend the outputs file points at is not this project's. */
export const amplifyOutputsMismatch = hasDataEndpoint && !matchesSchema

/**
 * True once a real, matching backend exists. When false (fresh clone, no sandbox
 * yet, or a foreign outputs file) the public pages read `data/seed-content.ts`
 * and write paths are disabled rather than throwing at request time.
 */
export const isAmplifyConfigured = hasDataEndpoint && matchesSchema

export const hasAuth = isAmplifyConfigured && Boolean(amplifyOutputs.auth?.user_pool_id)
export const hasStorage = isAmplifyConfigured && Boolean(amplifyOutputs.storage?.bucket_name)

export const ADMIN_GROUP = 'Admins'

if (amplifyOutputsMismatch && typeof window === 'undefined') {
  console.warn(
    `[qte] amplify_outputs.json points at a backend without this project's models ` +
      `(found: ${Object.keys(models).join(', ') || 'none'}). ` +
      `Deploy this repo's amplify/ folder with \`npx ampx sandbox\` or Amplify Hosting.`
  )
}
