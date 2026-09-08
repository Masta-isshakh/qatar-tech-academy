import { defineAuth } from '@aws-amplify/backend'

/**
 * Learners sign in with e-mail. Academy staff are added to the `Admins` group,
 * which is the only group with write access to content models and read access
 * to leads and registrations.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  // No custom userAttributes: Cognito cannot change a pool's schema after it is
  // created, and the Hosting branch reuses the pool from the very first deploy.
  // Nothing in the app reads attributes beyond the sign-in e-mail.
  groups: ['Admins'],
})
