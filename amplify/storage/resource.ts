import { defineStorage } from '@aws-amplify/backend'

/**
 * `public/*`            — hero and track videos, partner logos. Guests stream, Admins upload.
 * `protected/lessons/*` — cohort lesson videos. Signed-in learners only.
 * `private/{entity_id}` — certificates and personal documents. Owner only.
 */
export const storage = defineStorage({
  name: 'qteMedia',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admins']).to(['read', 'write', 'delete']),
    ],
    'protected/lessons/*': [
      allow.authenticated.to(['read']),
      allow.groups(['Admins']).to(['read', 'write', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['Admins']).to(['read', 'write', 'delete']),
    ],
  }),
})
