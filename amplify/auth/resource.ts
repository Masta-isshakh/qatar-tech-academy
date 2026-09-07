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
  userAttributes: {
    email: { required: true, mutable: true },
    preferredUsername: { required: false, mutable: true },
    phoneNumber: { required: false, mutable: true },
    locale: { required: false, mutable: true },
  },
  groups: ['Admins'],
})
