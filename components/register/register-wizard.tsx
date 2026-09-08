'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CalendarCheck, CheckCircle2, Loader2, MapPin } from 'lucide-react'

import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Honeypot, Input, Select, Textarea } from '@/components/ui/field'
import { EmptyState } from '@/components/ui/states'
import { cn, formatDateTime, formatPrice, pick } from '@/lib/utils'
import { site } from '@/lib/site'
import {
  OCCUPATIONS,
  registrationSchema,
  registrationStepSchemas,
  type RegistrationInput,
} from '@/lib/validation'
import { submitRegistration, type RegistrationResult } from '@/app/actions/forms'
import { trackEvent } from '@/components/providers/analytics'
import { Turnstile } from '@/components/site/turnstile'

const DRAFT_KEY = 'qte.register.draft'
const STEPS = 4

export type RegisterTrack = {
  slug: string
  titleEn: string
  titleAr: string
  taglineEn: string
  taglineAr: string
  priceQar: number
  isComingSoon: boolean
}

export type RegisterSlot = {
  id: string
  start: string
  end: string | null
  room: string | null
  capacity: number
  booked: number
}

export function RegisterWizard({
  tracks,
  slots,
  locale,
  initialTrack,
  backendReady,
}: {
  tracks: RegisterTrack[]
  slots: RegisterSlot[]
  locale: string
  initialTrack?: string
  backendReady: boolean
}) {
  const t = useTranslations('register')
  const tc = useTranslations('common')
  const tf = useTranslations('forms')

  const [step, setStep] = useState(0)
  const [result, setResult] = useState<RegistrationResult | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const stepLabels = t.raw('steps') as string[]

  const openSlots = useMemo(() => slots.filter((s) => s.booked < s.capacity), [slots])

  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '+974 ',
      email: '',
      qid: '',
      occupation: 'STUDENT',
      university: '',
      degree: '',
      employer: '',
      trackSlug: initialTrack ?? '',
      slotId: '',
      notes: '',
      locale: locale === 'en' ? 'en' : 'ar',
      consent: true,
      website: '',
    },
  })

  const { register, handleSubmit, watch, setValue, trigger, getValues, formState } = form
  const values = watch()

  /* ------------------------------------------------------------- draft */

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as Partial<RegistrationInput>
      let restored = false
      for (const [key, value] of Object.entries(draft)) {
        if (typeof value === 'string' && value) {
          setValue(key as keyof RegistrationInput, value as never)
          restored = true
        }
      }
      if (restored) toast.info(t('draftRestored'))
    } catch {
      /* corrupt draft — ignore it */
    }
    // Restoring once on mount is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (result) return
    try {
      const { website: _website, consent: _consent, ...rest } = values
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(rest))
    } catch {
      /* storage unavailable — the form still works */
    }
  }, [values, result])

  /* ------------------------------------------------------------- steps */

  const fieldsForStep: Record<number, (keyof RegistrationInput)[]> = {
    0: ['trackSlug'],
    1: ['name', 'phone', 'email', 'qid', 'occupation'],
    2: [],
    3: ['consent'],
  }

  const next = useCallback(async () => {
    const fields = fieldsForStep[step] ?? []
    // `trigger` paints the inline errors; the step schema decides whether we may
    // move on, because trigger()'s return value also reflects fields the user
    // has not reached yet.
    await trigger(fields)
    if (!registrationStepSchemas[step]?.safeParse(getValues()).success) return

    setStep((s) => Math.min(s + 1, STEPS - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, trigger, getValues])

  const submitReview = handleSubmit(async (data) => {
    const response = await submitRegistration({ ...data, turnstileToken })

    if (!response.ok) {
      toast.error(response.error === 'unavailable' ? tf('error') : tf('error'))
      return
    }

    trackEvent('registration_submitted', { track: data.trackSlug, booked: response.data?.booked })
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    setResult(response.data ?? { registrationId: '', booked: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  const selectedTrack = tracks.find((tr) => tr.slug === values.trackSlug)
  const selectedSlot = openSlots.find((s) => s.id === values.slotId)

  /* ---------------------------------------------------------- success */

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          role="status"
          aria-live="polite"
          className="border-border-subtle bg-background flex flex-col gap-4 rounded-2xl border p-8 text-center"
        >
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
          <h2 className="text-2xl">{t('successTitle')}</h2>
          <p className="text-muted">{result.booked ? t('successBody') : t('successNoSlot')}</p>

          {result.booked && result.slotStart ? (
            <div className="bg-surface rounded-2xl p-5 text-start">
              <p className="mb-2 text-sm font-bold">{t('yourSlot')}</p>
              <p className="flex items-center gap-2 text-sm">
                <CalendarCheck className="text-primary-ink size-4 shrink-0" aria-hidden />
                {formatDateTime(result.slotStart, locale)}
              </p>
              {result.room ? (
                <p className="mt-1 flex items-center gap-2 text-sm">
                  <MapPin className="text-primary-ink size-4 shrink-0" aria-hidden />
                  {result.room}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/portal">{t('createAccount')}</Link>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null)
                setStep(0)
                form.reset()
              }}
            >
              {t('startOver')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------- form */

  return (
    <form
      onSubmit={(e) => {
        // Belt and braces: only the review step may submit, whatever fired it.
        if (step !== STEPS - 1) {
          e.preventDefault()
          return
        }
        void submitReview(e)
      }}
      noValidate
      className="mx-auto max-w-2xl"
    >
      <Honeypot label={tf('leaveBlank')} />

      <ol className="mb-8 flex gap-2" aria-label={t('stepOf', { current: step + 1, total: STEPS })}>
        {stepLabels.map((label, i) => (
          <li key={label} className="flex-1">
            <div
              className={cn(
                'h-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-border-subtle'
              )}
            />
            <span
              className={cn(
                'mt-2 block text-xs font-semibold',
                i === step ? 'text-primary-ink' : 'text-muted'
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Step 1 — track */}
      {step === 0 ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-xl font-bold">{t('chooseTrack')}</legend>
          <p className="text-muted -mt-2 text-sm">{t('chooseTrackHint')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {tracks
              .filter((tr) => !tr.isComingSoon)
              .map((tr) => {
                const active = values.trackSlug === tr.slug
                return (
                  <label
                    key={tr.slug}
                    className={cn(
                      'flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-colors',
                      active
                        ? 'border-primary bg-maroon-soft'
                        : 'border-border-subtle hover:bg-surface'
                    )}
                  >
                    <input
                      type="radio"
                      value={tr.slug}
                      className="sr-only"
                      {...register('trackSlug')}
                    />
                    <span className="font-bold">{pick(locale, tr.titleEn, tr.titleAr)}</span>
                    <span className="text-muted text-sm">
                      {pick(locale, tr.taglineEn, tr.taglineAr)}
                    </span>
                    <span className="ltr-nums text-primary-ink mt-1 text-sm font-semibold">
                      {formatPrice(tr.priceQar)} {tc('qar')}
                    </span>
                  </label>
                )
              })}
          </div>
          {/* Always rendered, so clearing the error does not shift the buttons. */}
          <p role="alert" className="min-h-4 text-xs font-medium text-red-700 dark:text-red-400">
            {formState.errors.trackSlug ? tf('selectOne') : ''}
          </p>
        </fieldset>
      ) : null}

      {/* Step 2 — personal details */}
      {step === 1 ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-4 text-xl font-bold">{t('personal')}</legend>

          <Field
            label={t('fields.name')}
            htmlFor="name"
            required
            error={formState.errors.name ? tf('required') : undefined}
          >
            <Input
              id="name"
              autoComplete="name"
              placeholder={tf('namePlaceholder')}
              aria-invalid={Boolean(formState.errors.name)}
              {...register('name')}
            />
          </Field>

          <div className="grid gap-1 sm:grid-cols-2">
            <Field
              label={t('fields.phone')}
              htmlFor="phone"
              required
              error={formState.errors.phone ? tf('invalidPhone') : undefined}
            >
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(formState.errors.phone)}
                {...register('phone')}
              />
            </Field>

            <Field
              label={t('fields.email')}
              htmlFor="email"
              required
              error={formState.errors.email ? tf('invalidEmail') : undefined}
            >
              <Input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                aria-invalid={Boolean(formState.errors.email)}
                {...register('email')}
              />
            </Field>
          </div>

          <div className="grid gap-1 sm:grid-cols-2">
            <Field label={t('fields.occupation')} htmlFor="occupation" required>
              <Select id="occupation" {...register('occupation')}>
                {OCCUPATIONS.map((o) => (
                  <option key={o} value={o}>
                    {t(`occupations.${o}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={t('fields.qid')}
              htmlFor="qid"
              error={formState.errors.qid ? tf('required') : undefined}
            >
              <Input id="qid" dir="ltr" inputMode="numeric" maxLength={11} {...register('qid')} />
            </Field>
          </div>

          {values.occupation === 'EMPLOYEE' ? (
            <Field label={t('fields.employer')} htmlFor="employer">
              <Input id="employer" autoComplete="organization" {...register('employer')} />
            </Field>
          ) : (
            <div className="grid gap-1 sm:grid-cols-2">
              <Field label={t('fields.university')} htmlFor="university">
                <Input id="university" {...register('university')} />
              </Field>
              <Field label={t('fields.degree')} htmlFor="degree">
                <Input id="degree" {...register('degree')} />
              </Field>
            </div>
          )}

          <Field label={t('fields.notes')} htmlFor="notes">
            <Textarea id="notes" rows={3} {...register('notes')} />
          </Field>
        </fieldset>
      ) : null}

      {/* Step 3 — test slot */}
      {step === 2 ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-xl font-bold">{t('chooseSlot')}</legend>
          <p className="text-muted -mt-2 text-sm">{t('chooseSlotHint')}</p>

          {openSlots.length === 0 ? (
            <EmptyState title={t('noSlots')} />
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {openSlots.map((slot) => {
                  const active = values.slotId === slot.id
                  const left = slot.capacity - slot.booked
                  return (
                    <label
                      key={slot.id}
                      className={cn(
                        'flex cursor-pointer items-start justify-between gap-3 rounded-2xl border p-4 transition-colors',
                        active
                          ? 'border-primary bg-maroon-soft'
                          : 'border-border-subtle hover:bg-surface'
                      )}
                    >
                      <input
                        type="radio"
                        value={slot.id}
                        className="sr-only"
                        {...register('slotId')}
                      />
                      <span className="text-sm font-semibold">
                        {formatDateTime(slot.start, locale)}
                      </span>
                      <span className="ltr-nums text-muted shrink-0 text-xs">
                        {left} {tc('seatsLeft')}
                      </span>
                    </label>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setValue('slotId', '')}
                className="text-muted hover:text-primary-ink self-start text-sm underline underline-offset-4"
              >
                {t('skipSlot')}
              </button>
            </>
          )}
        </fieldset>
      ) : null}

      {/* Step 4 — review */}
      {step === 3 ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-xl font-bold">{t('review')}</legend>

          <dl className="divide-border-subtle border-border-subtle divide-y rounded-2xl border">
            <Row
              label={stepLabels[0] ?? ''}
              value={
                selectedTrack ? pick(locale, selectedTrack.titleEn, selectedTrack.titleAr) : '—'
              }
            />
            <Row label={t('fields.name')} value={values.name} />
            <Row label={t('fields.phone')} value={values.phone} ltr />
            <Row label={t('fields.email')} value={values.email} ltr />
            <Row label={t('fields.occupation')} value={t(`occupations.${values.occupation}`)} />
            <Row
              label={t('yourSlot')}
              value={selectedSlot ? formatDateTime(selectedSlot.start, locale) : '—'}
            />
          </dl>

          <label className="bg-surface flex items-start gap-3 rounded-2xl p-4 text-sm">
            <Checkbox
              id="consent"
              checked={values.consent === true}
              onCheckedChange={(checked) =>
                setValue('consent', checked === true ? true : (false as never), {
                  shouldValidate: true,
                })
              }
            />
            <span>
              {t('consentLabel')}{' '}
              <Link href="/privacy" className="hover:text-primary-ink underline underline-offset-2">
                {tf('privacyNote')}
              </Link>
            </span>
          </label>
          <p role="alert" className="min-h-4 text-xs font-medium text-red-700 dark:text-red-400">
            {formState.errors.consent ? t('consentRequired') : ''}
          </p>

          <Turnstile onToken={setTurnstileToken} />

          {!backendReady ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {tf('error')} ({site.email})
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || formState.isSubmitting}
        >
          {tc('back')}
        </Button>

        {/*
          Distinct keys so React never reuses the Next button's DOM node for the
          Submit button. Without them, a click on Next re-rendered the same
          <button> as type="submit" before the browser applied the click's
          default action, and the form submitted itself on arrival at step 4.
        */}
        {step < STEPS - 1 ? (
          <Button key="next" type="button" onClick={next}>
            {tc('next')}
          </Button>
        ) : (
          <Button key="submit" type="submit" disabled={formState.isSubmitting || !backendReady}>
            {formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tc('sending')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
        )}
      </div>
    </form>
  )
}

function Row({ label, value, ltr }: { label: string; value?: string; ltr?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className={cn('text-sm font-semibold', ltr && 'ltr-nums')}>{value || '—'}</dd>
    </div>
  )
}
