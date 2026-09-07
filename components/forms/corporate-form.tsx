'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox, Field, Honeypot, Input, Textarea } from '@/components/ui/field'
import { Turnstile } from '@/components/site/turnstile'
import { corporateSchema, type CorporateInput } from '@/lib/validation'
import { submitCorporate } from '@/app/actions/forms'
import { trackEvent } from '@/components/providers/analytics'
import { corporateDiscountFor } from '@/data/seed-content'
import { formatPrice, pick } from '@/lib/utils'

export type CorporateTrack = {
  slug: string
  titleEn: string
  titleAr: string
  priceQar: number
}

export function CorporateForm({
  tracks,
  locale,
  backendReady,
}: {
  tracks: CorporateTrack[]
  locale: string
  backendReady: boolean
}) {
  const t = useTranslations('corporate')
  const tf = useTranslations('forms')
  const tc = useTranslations('common')
  const [done, setDone] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const { register, handleSubmit, formState, watch, setValue, reset } = useForm<CorporateInput>({
    resolver: zodResolver(corporateSchema),
    mode: 'onTouched',
    defaultValues: {
      company: '',
      contactName: '',
      phone: '+974 ',
      email: '',
      headcount: 20,
      tracks: [],
      message: '',
      locale: locale === 'en' ? 'en' : 'ar',
      website: '',
    },
  })

  const seats = Number(watch('headcount')) || 0
  const selectedRaw = watch('tracks')
  const selected = useMemo(() => selectedRaw ?? [], [selectedRaw])

  /* ROI calculator: the list price of the selected tracks (or the cheapest
     track, so the number is never zero), times seats, minus the volume tier. */
  const quote = useMemo(() => {
    const chosen = tracks.filter((tk) => selected.includes(tk.slug) && tk.priceQar > 0)
    const pool = chosen.length ? chosen : tracks.filter((tk) => tk.priceQar > 0).slice(0, 1)
    const listPerSeat = pool.reduce((sum, tk) => sum + tk.priceQar, 0)
    const discount = corporateDiscountFor(seats)
    const perSeat = Math.round(listPerSeat * (1 - discount))
    return { listPerSeat, discount, perSeat, total: perSeat * seats }
  }, [tracks, selected, seats])

  const onSubmit = handleSubmit(async (data) => {
    const res = await submitCorporate({ ...data, turnstileToken })
    if (!res.ok) {
      toast.error(tf('error'))
      return
    }
    trackEvent('corporate_submitted', { headcount: data.headcount })
    toast.success(t('success'))
    reset()
    setDone(true)
  })

  function toggleTrack(slug: string, checked: boolean) {
    const next = checked ? [...selected, slug] : selected.filter((s) => s !== slug)
    setValue('tracks', next, { shouldValidate: true })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {done ? (
        <div
          role="status"
          aria-live="polite"
          className="border-border-subtle bg-background flex flex-col items-center gap-3 rounded-2xl border p-8 text-center"
        >
          <CheckCircle2 className="size-10 text-emerald-600" aria-hidden />
          <p className="font-bold">{t('success')}</p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="border-border-subtle bg-background relative flex flex-col gap-1 rounded-2xl border p-6"
        >
          <Honeypot label={tf('leaveBlank')} />

          <div className="grid gap-1 sm:grid-cols-2">
            <Field
              label={t('fields.company')}
              htmlFor="company"
              required
              error={formState.errors.company ? tf('required') : undefined}
            >
              <Input
                id="company"
                autoComplete="organization"
                aria-invalid={Boolean(formState.errors.company)}
                {...register('company')}
              />
            </Field>
            <Field
              label={t('fields.contactName')}
              htmlFor="contactName"
              required
              error={formState.errors.contactName ? tf('required') : undefined}
            >
              <Input
                id="contactName"
                autoComplete="name"
                aria-invalid={Boolean(formState.errors.contactName)}
                {...register('contactName')}
              />
            </Field>
          </div>

          <div className="grid gap-1 sm:grid-cols-2">
            <Field
              label={t('fields.phone')}
              htmlFor="corp-phone"
              required
              error={formState.errors.phone ? tf('invalidPhone') : undefined}
            >
              <Input
                id="corp-phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                aria-invalid={Boolean(formState.errors.phone)}
                {...register('phone')}
              />
            </Field>
            <Field
              label={t('fields.email')}
              htmlFor="corp-email"
              error={formState.errors.email ? tf('invalidEmail') : undefined}
            >
              <Input
                id="corp-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                aria-invalid={Boolean(formState.errors.email)}
                {...register('email')}
              />
            </Field>
          </div>

          <Field
            label={t('fields.headcount')}
            htmlFor="headcount"
            required
            error={formState.errors.headcount ? tf('required') : undefined}
          >
            <Input
              id="headcount"
              type="number"
              min={1}
              max={10000}
              dir="ltr"
              aria-invalid={Boolean(formState.errors.headcount)}
              {...register('headcount')}
            />
          </Field>

          <fieldset className="mb-3">
            <legend className="mb-2 text-sm font-semibold">{t('fields.tracks')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {tracks.map((tk) => (
                <label key={tk.slug} className="flex items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={selected.includes(tk.slug)}
                    onCheckedChange={(c) => toggleTrack(tk.slug, c === true)}
                  />
                  {pick(locale, tk.titleEn, tk.titleAr)}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={t('fields.message')} htmlFor="corp-message">
            <Textarea id="corp-message" rows={4} {...register('message')} />
          </Field>

          <Turnstile onToken={setTurnstileToken} />
          <p className="text-muted mb-3 text-xs">{tf('privacyNote')}</p>

          <Button
            type="submit"
            disabled={formState.isSubmitting || !backendReady}
            className="self-start"
          >
            {formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tc('sending')}
              </>
            ) : (
              t('formTitle')
            )}
          </Button>
        </form>
      )}

      <aside
        aria-live="polite"
        className="border-border-subtle bg-surface flex h-fit flex-col gap-3 rounded-2xl border p-6 lg:sticky lg:top-24"
      >
        <h3 className="text-lg font-bold">{t('calculator.title')}</h3>
        <Line label={t('calculator.seats')} value={String(seats)} />
        <Line
          label={t('calculator.listPrice')}
          value={`${formatPrice(quote.listPerSeat)} ${tc('qar')}`}
        />
        <Line label={t('calculator.discount')} value={`${Math.round(quote.discount * 100)}%`} />
        <Line
          label={t('calculator.perSeat')}
          value={`${formatPrice(quote.perSeat)} ${tc('qar')}`}
        />
        <div className="border-border-subtle border-t pt-3">
          <p className="text-muted text-sm">{t('calculator.total')}</p>
          <p className="ltr-nums text-primary-ink text-2xl font-extrabold">
            {formatPrice(quote.total)} <span className="text-base">{tc('qar')}</span>
          </p>
        </div>
        <p className="text-muted text-xs">{t('calculator.note')}</p>
      </aside>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="ltr-nums font-semibold">{value}</span>
    </div>
  )
}
