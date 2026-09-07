'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const controlClasses =
  'w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-[0.95rem] text-foreground transition-colors placeholder:text-muted/70 focus-visible:border-primary disabled:opacity-60 aria-[invalid=true]:border-red-600'

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-foreground text-sm font-semibold', className)}
    {...props}
  />
))
Label.displayName = 'Label'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlClasses, className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} rows={4} className={cn(controlClasses, 'resize-y', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(controlClasses, 'appearance-none pe-9', className)} {...props} />
))
Select.displayName = 'Select'

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer border-border-subtle bg-background data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground size-5 shrink-0 rounded-md border',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <Check className="size-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = 'Checkbox'

/** Label + control + inline error, wired for screen readers. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  const errorId = `${htmlFor}-error`
  const hintId = `${htmlFor}-hint`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-primary-ink"> *</span> : null}
      </Label>
      {hint ? (
        <p id={hintId} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
      {children}
      <p
        id={errorId}
        role="alert"
        className="min-h-4 text-xs font-medium text-red-700 dark:text-red-400"
      >
        {error ?? ''}
      </p>
    </div>
  )
}

/**
 * Off-screen decoy input. Bots fill every field they find; humans never see it.
 * Paired with a Turnstile token where a site key is configured.
 */
export function Honeypot({ name = 'website', label }: { name?: string; label: string }) {
  return (
    <div aria-hidden className="absolute top-auto left-[-9999px] h-px w-px overflow-hidden">
      <label htmlFor={`hp-${name}`}>{label}</label>
      <input id={`hp-${name}`} name={name} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}
