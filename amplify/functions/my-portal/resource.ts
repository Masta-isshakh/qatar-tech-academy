import { defineFunction } from '@aws-amplify/backend'

/**
 * Resolves the signed-in learner's own registration, appointment and enrollments.
 *
 * Registrations are created anonymously (public API key) so they carry no `owner`
 * field. Rather than widening read access on the model — which would expose every
 * applicant's personal data to any signed-in user — the portal reads through this
 * function, which matches strictly on the caller's verified Cognito e-mail claim.
 */
export const myPortal = defineFunction({
  name: 'my-portal',
  entry: './handler.ts',
  timeoutSeconds: 20,
})
