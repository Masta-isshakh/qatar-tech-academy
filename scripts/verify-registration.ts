/**
 * End-to-end check of the registration pipeline against the deployed backend:
 * finds the registration created for TEST_EMAIL, its TestAppointment, and the
 * slot's `booked` counter. Signs in as the seed admin (reads are Admins-only).
 *
 *   npx tsx scripts/verify-registration.ts qte-e2e@example.com
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Amplify } from 'aws-amplify'
import { signIn, signOut } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../amplify/data/resource'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputs = JSON.parse(readFileSync(join(root, 'amplify_outputs.json'), 'utf8'))
const envFile = join(root, '.env.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!
  }
}
const email = (process.argv[2] ?? '').toLowerCase()
if (!email) throw new Error('usage: verify-registration <email>')

Amplify.configure(outputs)
const client = generateClient<Schema>({ authMode: 'userPool' })

async function main() {
  await signOut().catch(() => {})
  await signIn({
    username: process.env.SEED_ADMIN_EMAIL!,
    password: process.env.SEED_ADMIN_PASSWORD!,
  })

  const { data: regs } = await client.models.Registration.list({ filter: { email: { eq: email } } })
  const reg = regs?.[0]
  if (!reg) throw new Error(`no Registration for ${email}`)
  console.log('Registration:', reg.id, reg.status, reg.trackSlug)

  const { data: appts } = await client.models.TestAppointment.list({
    filter: { registrationId: { eq: reg.id } },
  })
  const appt = appts?.[0]
  if (!appt) throw new Error('no TestAppointment')
  console.log('TestAppointment:', appt.id, appt.status, appt.slotStart, appt.room)

  if (appt.slotId) {
    const { data: slot } = await client.models.TestSlot.get({ id: appt.slotId })
    console.log('TestSlot booked/capacity:', slot?.booked, '/', slot?.capacity)
    if (!slot || (slot.booked ?? 0) < 1) throw new Error('slot.booked was not incremented')
  }
  if (reg.status !== 'TEST_SCHEDULED') throw new Error(`expected TEST_SCHEDULED, got ${reg.status}`)
  console.log('PIPELINE OK')
  await signOut()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
