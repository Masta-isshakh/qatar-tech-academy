'use server'

import { isAmplifyConfigured } from '@/lib/amplify'
import { publicServerClient } from '@/lib/amplify-server'
import { getTracks } from '@/lib/content'
import {
  corporateSchema,
  leadSchema,
  registrationSchema,
  type ActionResult,
  type CorporateInput,
  type LeadInput,
  type RegistrationInput,
} from '@/lib/validation'
import { verifyTurnstile } from '@/lib/turnstile'

async function trackIdFor(slug?: string | null) {
  if (!slug) return undefined
  const tracks = await getTracks()
  const match = tracks.find((t) => t.slug === slug)
  // Seed fallback ids are slugs, not real record ids — only send a real one.
  return match && match.id !== match.slug ? match.id : undefined
}

/* ------------------------------------------------------------------- leads */

export async function submitLead(input: LeadInput): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'validation', field: parsed.error.issues[0]?.path.join('.') }
  }

  const data = parsed.data
  // Honeypot: pretend it worked so the bot stops retrying.
  if (data.website) return { ok: true }
  if (!(await verifyTurnstile(data.turnstileToken))) return { ok: false, error: 'validation' }
  if (!isAmplifyConfigured) return { ok: false, error: 'unavailable' }

  try {
    const { data: lead, errors } = await publicServerClient.models.Lead.create({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      organisation: data.organisation || undefined,
      trackId: await trackIdFor(data.trackSlug),
      trackSlug: data.trackSlug || undefined,
      message: data.message || undefined,
      locale: data.locale,
      source: data.source,
      status: 'NEW',
    })

    if (errors?.length || !lead) {
      console.error('[submitLead] create failed', errors)
      return { ok: false, error: 'backend' }
    }

    // Notification failures must not fail the visitor's submission.
    await publicServerClient.mutations
      .notifyLead({
        leadId: lead.id,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        organisation: data.organisation || undefined,
        trackSlug: data.trackSlug || undefined,
        message: data.message || undefined,
        locale: data.locale,
        source: data.source,
      })
      .catch((err) => console.error('[submitLead] notifyLead failed', err))

    return { ok: true }
  } catch (err) {
    console.error('[submitLead] unexpected', err)
    return { ok: false, error: 'backend' }
  }
}

/* ----------------------------------------------------------- registrations */

export type RegistrationResult = {
  registrationId: string
  booked: boolean
  slotStart?: string | null
  slotEnd?: string | null
  room?: string | null
}

export async function submitRegistration(
  input: RegistrationInput
): Promise<ActionResult<RegistrationResult>> {
  const parsed = registrationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'validation', field: parsed.error.issues[0]?.path.join('.') }
  }

  const data = parsed.data
  if (data.website) return { ok: false, error: 'validation' }
  if (!(await verifyTurnstile(data.turnstileToken))) return { ok: false, error: 'validation' }
  if (!isAmplifyConfigured) return { ok: false, error: 'unavailable' }

  try {
    const { data: registration, errors } = await publicServerClient.models.Registration.create({
      name: data.name,
      phone: data.phone,
      email: data.email.toLowerCase(),
      qid: data.qid || undefined,
      occupation: data.occupation,
      university: data.university || undefined,
      degree: data.degree || undefined,
      employer: data.employer || undefined,
      trackId: await trackIdFor(data.trackSlug),
      trackSlug: data.trackSlug,
      locale: data.locale,
      status: 'APPLIED',
      notes: data.notes || undefined,
    })

    if (errors?.length || !registration) {
      console.error('[submitRegistration] create failed', errors)
      return { ok: false, error: 'backend' }
    }

    if (!data.slotId) {
      return { ok: true, data: { registrationId: registration.id, booked: false } }
    }

    const { data: booking, errors: bookingErrors } =
      await publicServerClient.mutations.bookTestSlot({
        registrationId: registration.id,
        slotId: data.slotId,
        locale: data.locale,
      })

    if (bookingErrors?.length) {
      console.error('[submitRegistration] bookTestSlot failed', bookingErrors)
      // The registration itself is saved — staff will call to arrange the test.
      return { ok: true, data: { registrationId: registration.id, booked: false } }
    }

    const result = (typeof booking === 'string' ? JSON.parse(booking) : booking) as {
      ok?: boolean
      reason?: string
      slotStart?: string | null
      slotEnd?: string | null
      room?: string | null
    } | null

    if (!result?.ok) {
      return {
        ok: true,
        data: { registrationId: registration.id, booked: false },
      }
    }

    return {
      ok: true,
      data: {
        registrationId: registration.id,
        booked: true,
        slotStart: result.slotStart ?? null,
        slotEnd: result.slotEnd ?? null,
        room: result.room ?? null,
      },
    }
  } catch (err) {
    console.error('[submitRegistration] unexpected', err)
    return { ok: false, error: 'backend' }
  }
}

/* --------------------------------------------------------------- corporate */

export async function submitCorporate(input: CorporateInput): Promise<ActionResult> {
  const parsed = corporateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'validation', field: parsed.error.issues[0]?.path.join('.') }
  }

  const data = parsed.data
  if (data.website) return { ok: true }
  if (!(await verifyTurnstile(data.turnstileToken))) return { ok: false, error: 'validation' }
  if (!isAmplifyConfigured) return { ok: false, error: 'unavailable' }

  try {
    const { data: enquiry, errors } = await publicServerClient.models.CorporateEnquiry.create({
      company: data.company,
      contactName: data.contactName,
      phone: data.phone,
      email: data.email || undefined,
      headcount: data.headcount,
      tracks: data.tracks,
      message: data.message || undefined,
      status: 'NEW',
    })

    if (errors?.length || !enquiry) {
      console.error('[submitCorporate] create failed', errors)
      return { ok: false, error: 'backend' }
    }

    await publicServerClient.mutations
      .notifyCorporate({
        enquiryId: enquiry.id,
        company: data.company,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email || undefined,
        headcount: data.headcount,
        tracks: data.tracks,
        message: data.message || undefined,
        locale: data.locale,
      })
      .catch((err) => console.error('[submitCorporate] notifyCorporate failed', err))

    return { ok: true }
  } catch (err) {
    console.error('[submitCorporate] unexpected', err)
    return { ok: false, error: 'backend' }
  }
}
