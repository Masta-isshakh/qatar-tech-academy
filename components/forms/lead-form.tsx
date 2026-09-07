'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, Honeypot, Input, Select, Textarea } from '@/components/ui/field'
import { Turnstile } from '@/components/site/turnstile'
import { leadSchema, type LeadInput } from '@/lib/validation'
import { submitLead } from '@/app/actions/forms'
import { trackEvent } from '@/components/providers/analytics'
import { pick } from '@/lib/utils'

export type LeadFormTrack = { slug: string; titleEn: string; titleAr: string }

/**
 * The one public enquiry form, reused by contact, exam-centre and investors.
 * `source` is stored on the Lead so the team can see where it came from.
 */
export function LeadForm({
  source,
  locale,
  tracks = [],
  showOrganisation = true,
  showTrack = false,
  messageLabel,
  submitLabel,
}: {
  source: string
  locale: string
  tracks?: LeadFormTrack[]
  showOrganisation?: boolean
  showTrack?: boolean
  messageLabel?: string
  submitLabel?: string
}) {
  const t = useTranslations('forms')
  const tc = useTranslations('common')
  const tr = useTranslations('register')
  const [done, setDone] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const { register, handleSubmit, formState, reset } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '+974 ',
      email: '',
      organisation: '',
      trackSlug: '',
      message: '',
      locale: locale === 'en' ? 'en' : 'ar',
      source,
      website: '',
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    const res = await submitLead({ ...data, turnstileToken })
    if (!res.ok) {
      toast.error(t('error'))
      return
    }
    trackEvent('lead_submitted', { source })
    toast.success(t('success'))
    reset()
    setDone(true)
  })

  if (done) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-border-subtle bg-background flex flex-col items-center gap-3 rounded-2xl border p-8 text-center"
      >
        <CheckCircle2 className="size-10 text-emerald-600" aria-hidden />
        <p className="font-bold">{t('success')}</p>
        <Button variant="secondary" size="sm" onClick={() => setDone(false)}>
          {tc('create')}
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="border-border-subtle bg-background relative flex flex-col gap-1 rounded-2xl border p-6"
    >
      <Honeypot label={t('leaveBlank')} />

      <Field
        label={tr('fields.name')}
        htmlFor={`${source}-name`}
        required
        error={formState.errors.name ? t('required') : undefined}
      >
        <Input
          id={`${source}-name`}
          autoComplete="name"
          placeholder={t('namePlaceholder')}
          aria-invalid={Boolean(formState.errors.name)}
          {...register('name')}
        />
      </Field>

      <div className="grid gap-1 sm:grid-cols-2">
        <Field
          label={tr('fields.phone')}
          htmlFor={`${source}-phone`}
          required
          error={formState.errors.phone ? t('invalidPhone') : undefined}
        >
          <Input
            id={`${source}-phone`}
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(formState.errors.phone)}
            {...register('phone')}
          />
        </Field>

        <Field
          label={tr('fields.email')}
          htmlFor={`${source}-email`}
          error={formState.errors.email ? t('invalidEmail') : undefined}
        >
          <Input
            id={`${source}-email`}
            type="email"
            dir="ltr"
            autoComplete="email"
            aria-invalid={Boolean(formState.errors.email)}
            {...register('email')}
          />
        </Field>
      </div>

      {showOrganisation ? (
        <Field label={tr('fields.employer')} htmlFor={`${source}-org`}>
          <Input id={`${source}-org`} autoComplete="organization" {...register('organisation')} />
        </Field>
      ) : null}

      {showTrack && tracks.length > 0 ? (
        <Field label={tr('chooseTrack')} htmlFor={`${source}-track`}>
          <Select id={`${source}-track`} {...register('trackSlug')}>
            <option value="">—</option>
            {tracks.map((tk) => (
              <option key={tk.slug} value={tk.slug}>
                {pick(locale, tk.titleEn, tk.titleAr)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label={messageLabel ?? tr('fields.notes')} htmlFor={`${source}-message`}>
        <Textarea id={`${source}-message`} rows={4} {...register('message')} />
      </Field>

      <Turnstile onToken={setTurnstileToken} />

      <p className="text-muted mb-3 text-xs">{t('privacyNote')}</p>

      <Button type="submit" disabled={formState.isSubmitting} className="self-start">
        {formState.isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {tc('sending')}
          </>
        ) : (
          (submitLabel ?? tc('submit'))
        )}
      </Button>
    </form>
  )
}
