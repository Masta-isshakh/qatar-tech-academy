import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime'
// eslint-disable-next-line import/no-unresolved
import { env } from '$amplify/env/my-portal'
import type { Schema } from '../../data/resource'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env)
Amplify.configure(resourceConfig, libraryOptions)
const client = generateClient<Schema>({ authMode: 'iam' })

type Identity = { claims?: Record<string, unknown>; sub?: string }

function callerEmail(identity: unknown): string | null {
  const claims = (identity as Identity | undefined)?.claims
  const email = claims?.email
  return typeof email === 'string' && email.includes('@') ? email.toLowerCase() : null
}

function callerSub(identity: unknown): string | null {
  const id = identity as Identity | undefined
  const sub = id?.sub ?? id?.claims?.sub
  return typeof sub === 'string' ? sub : null
}

export const handler: Schema['myPortal']['functionHandler'] = async (event) => {
  const email = callerEmail(event.identity)
  const sub = callerSub(event.identity)
  if (!email) return { registration: null, appointment: null, enrollments: [] }

  const { data: registrations } = await client.models.Registration.list({
    filter: { email: { eq: email } },
    limit: 5,
  })
  const registration = registrations?.[0] ?? null

  let appointment = null
  if (registration) {
    const { data: appointments } = await client.models.TestAppointment.list({
      filter: { registrationId: { eq: registration.id } },
      limit: 10,
    })
    appointment =
      (appointments ?? [])
        .filter((a) => a.status !== 'RESCHEDULED')
        .sort((a, b) => (a.slotStart ?? '').localeCompare(b.slotStart ?? ''))
        .at(-1) ?? null
  }

  const { data: enrollments } = await client.models.Enrollment.list({
    filter: sub ? { userId: { eq: sub } } : { userId: { eq: email } },
    limit: 50,
  })

  return {
    registration: registration
      ? {
          id: registration.id,
          name: registration.name,
          status: registration.status,
          trackSlug: registration.trackSlug,
          testScore: registration.testScore,
          createdAt: registration.createdAt,
        }
      : null,
    appointment: appointment
      ? {
          id: appointment.id,
          slotStart: appointment.slotStart,
          slotEnd: appointment.slotEnd,
          room: appointment.room,
          status: appointment.status,
        }
      : null,
    enrollments: (enrollments ?? []).map((e) => ({
      id: e.id,
      trackId: e.trackId,
      cohortId: e.cohortId,
      status: e.status,
      certificateKey: e.certificateKey,
    })),
  }
}
