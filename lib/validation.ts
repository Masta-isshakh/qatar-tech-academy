import { z } from 'zod'

/** Accepts +974 3312 3456, 0097433123456, 33123456 and the usual variants. */
const phone = z
  .string()
  .trim()
  .min(6)
  .max(24)
  .refine((v) => {
    const digits = v.replace(/[^\d]/g, '')
    return digits.length >= 8 && digits.length <= 15
  }, 'invalidPhone')

const optionalText = z.string().trim().max(500).optional().or(z.literal(''))

/** Filled only by bots; a non-empty value means "drop it silently". */
const honeypot = z.string().max(0).optional().or(z.literal(''))

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  organisation: optionalText,
  trackSlug: z.string().trim().max(60).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  locale: z.enum(['ar', 'en']).default('ar'),
  source: z.string().trim().max(40).default('web'),
  website: honeypot,
  turnstileToken: z.string().optional(),
})
export type LeadInput = z.infer<typeof leadSchema>

export const OCCUPATIONS = ['STUDENT', 'GRADUATE', 'LECTURER', 'EMPLOYEE'] as const

export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().email().max(160),
  qid: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'invalidQid')
    .optional()
    .or(z.literal('')),
  occupation: z.enum(OCCUPATIONS),
  university: optionalText,
  degree: optionalText,
  employer: optionalText,
  trackSlug: z.string().trim().min(1).max(60),
  slotId: z.string().trim().max(64).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  locale: z.enum(['ar', 'en']).default('ar'),
  consent: z.literal(true),
  website: honeypot,
  turnstileToken: z.string().optional(),
})
export type RegistrationInput = z.infer<typeof registrationSchema>

export const corporateSchema = z.object({
  company: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  headcount: z.coerce.number().int().min(1).max(10000),
  tracks: z.array(z.string().trim().max(60)).max(10).default([]),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  locale: z.enum(['ar', 'en']).default('ar'),
  website: honeypot,
  turnstileToken: z.string().optional(),
})
export type CorporateInput = z.infer<typeof corporateSchema>

/**
 * Per-step schemas for the registration wizard.
 *
 * The wizard decides whether a step may advance by parsing the current values
 * against these, rather than relying on react-hook-form's `trigger()` return
 * value — which reports on the whole resolver run and left the user stuck on
 * step 1 once any later field was still empty.
 */
export const registrationStepSchemas = [
  registrationSchema.pick({ trackSlug: true }),
  registrationSchema.pick({
    name: true,
    phone: true,
    email: true,
    qid: true,
    occupation: true,
  }),
  z.object({}),
  registrationSchema.pick({ consent: true }),
] as const

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: 'validation' | 'backend' | 'slot_full' | 'unavailable'; field?: string }
