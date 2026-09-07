'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, GripVertical, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { authedClient } from '@/lib/amplify-client'
import type { FieldSpec, ModelSpec } from '@/lib/admin-models'
import { Button } from '@/components/ui/button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { EmptyState, ListSkeleton } from '@/components/ui/states'
import { cn } from '@/lib/utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Row = Record<string, any> & { id: string }

function modelApi(model: string) {
  const client = authedClient()
  return (client?.models as any)?.[model] ?? null
}

/** Generic list + create/edit/delete for any model described by a ModelSpec. */
export function ModelManager({ spec, locale }: { spec: ModelSpec; locale: string }) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')

  const [rows, setRows] = useState<Row[] | null>(null)
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [busy, setBusy] = useState(false)

  const label = (f: { labelEn: string; labelAr: string }) =>
    locale === 'ar' ? f.labelAr : f.labelEn
  const tableFields = useMemo(() => spec.fields.filter((f) => f.inTable), [spec.fields])

  const load = useCallback(async () => {
    const api = modelApi(spec.model)
    if (!api) {
      setRows([])
      return
    }
    try {
      const { data } = await api.list({ limit: 500 })
      const list = (data ?? []) as Row[]
      setRows(
        spec.orderField
          ? [...list].sort((a, b) => (a[spec.orderField!] ?? 0) - (b[spec.orderField!] ?? 0))
          : list
      )
    } catch (err) {
      console.error(`[admin] ${spec.model}.list failed`, err)
      toast.error(tc('error'))
      setRows([])
    }
  }, [spec.model, spec.orderField, tc])

  useEffect(() => {
    void load()
  }, [load])

  async function save(values: Row) {
    const api = modelApi(spec.model)
    if (!api) return
    setBusy(true)
    try {
      if (values.id) {
        await api.update(values)
      } else {
        const { id: _id, ...rest } = values
        await api.create(rest)
      }
      toast.success(tc('save'))
      setEditing(null)
      await load()
    } catch (err) {
      console.error(`[admin] ${spec.model} save failed`, err)
      toast.error(tc('error'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    const api = modelApi(spec.model)
    if (!api) return
    setBusy(true)
    try {
      await api.delete({ id })
      toast.success(tc('delete'))
      await load()
    } catch (err) {
      console.error(`[admin] ${spec.model} delete failed`, err)
      toast.error(tc('error'))
    } finally {
      setBusy(false)
    }
  }

  /** Persists the new positions of every row whose index changed. */
  async function persistOrder(next: Row[]) {
    const api = modelApi(spec.model)
    const field = spec.orderField
    if (!api || !field) return
    setRows(next)
    try {
      await Promise.all(
        next.map((row, index) =>
          row[field] === index ? null : api.update({ id: row.id, [field]: index })
        )
      )
    } catch (err) {
      console.error(`[admin] ${spec.model} reorder failed`, err)
      toast.error(tc('error'))
      await load()
    }
  }

  function move(from: number, to: number) {
    if (!rows || to < 0 || to >= rows.length) return
    const next = [...rows]
    const [moved] = next.splice(from, 1)
    if (moved) next.splice(to, 0, moved)
    void persistOrder(next)
  }

  if (rows === null) return <ListSkeleton rows={4} />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{label(spec)}</h3>
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus className="size-4" aria-hidden />
          {tc('create')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t('noRows')} />
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((row, index) => (
            <li
              key={row.id}
              draggable={Boolean(spec.orderField)}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
              onDragOver={(e) => spec.orderField && e.preventDefault()}
              onDrop={(e) => {
                if (!spec.orderField) return
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                if (!Number.isNaN(from)) move(from, index)
              }}
              className={cn(
                'border-border-subtle bg-background flex items-center gap-3 rounded-xl border px-3 py-2.5',
                spec.orderField && 'cursor-grab'
              )}
            >
              {spec.orderField ? (
                <>
                  <GripVertical className="text-muted size-4 shrink-0" aria-hidden />
                  <span className="flex flex-col">
                    <button
                      type="button"
                      aria-label={`${tc('previous')} — ${index + 1}`}
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      className="text-muted hover:text-primary-ink disabled:opacity-30"
                    >
                      <ChevronUp className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`${tc('next')} — ${index + 1}`}
                      onClick={() => move(index, index + 1)}
                      disabled={index === rows.length - 1}
                      className="text-muted hover:text-primary-ink disabled:opacity-30"
                    >
                      <ChevronDown className="size-3.5" aria-hidden />
                    </button>
                  </span>
                </>
              ) : null}

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {tableFields.map((f) => (
                  <span key={f.name} className="min-w-0 truncate">
                    <span className="text-muted">{label(f)}: </span>
                    <span className="font-semibold">{formatValue(row[f.name])}</span>
                  </span>
                ))}
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={tc('edit')}
                  onClick={() => setEditing(row)}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={tc('delete')}
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`${tc('delete')}?`)) void remove(row.id)
                  }}
                >
                  <Trash2 className="size-4 text-red-700" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <RecordDialog
          spec={spec}
          locale={locale}
          initial={editing === 'new' ? {} : editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      ) : null}
    </div>
  )
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? '✓' : '✗'
  if (Array.isArray(value)) return value.join(', ')
  return String(value).slice(0, 60)
}

function RecordDialog({
  spec,
  locale,
  initial,
  busy,
  onClose,
  onSave,
}: {
  spec: ModelSpec
  locale: string
  initial: Partial<Row>
  busy: boolean
  onClose: () => void
  onSave: (values: Row) => void
}) {
  const tc = useTranslations('common')
  const [values, setValues] = useState<Record<string, any>>(() => ({ ...initial }))
  const label = (f: { labelEn: string; labelAr: string }) =>
    locale === 'ar' ? f.labelAr : f.labelEn

  function set(name: string, value: unknown) {
    setValues((v) => ({ ...v, [name]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, any> = {}
    if (initial.id) payload.id = initial.id
    for (const f of spec.fields) {
      const raw = values[f.name]
      if (raw === undefined) continue
      payload[f.name] =
        f.kind === 'number'
          ? raw === '' || raw === null
            ? null
            : Number(raw)
          : f.kind === 'list'
            ? String(raw ?? '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : f.kind === 'boolean'
              ? Boolean(raw)
              : raw === ''
                ? null
                : raw
    }
    onSave(payload as Row)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        closeLabel={tc('close')}
        className="max-h-[85vh] w-[min(48rem,calc(100vw-2rem))] overflow-y-auto p-6"
      >
        <DialogTitle className="mb-4 text-xl font-bold">
          {initial.id ? tc('edit') : tc('create')} — {label(spec)}
        </DialogTitle>

        <form onSubmit={submit} className="flex flex-col gap-1">
          {spec.fields.map((f) => (
            <FieldControl
              key={f.name}
              field={f}
              label={label(f)}
              value={values[f.name]}
              onChange={(v) => set(f.name, v)}
            />
          ))}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FieldControl({
  field,
  label,
  value,
  onChange,
}: {
  field: FieldSpec
  label: string
  value: any
  onChange: (value: unknown) => void
}) {
  const id = `f-${field.name}`

  if (field.kind === 'boolean') {
    return (
      <label className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
        <Checkbox id={id} checked={Boolean(value)} onCheckedChange={(c) => onChange(c === true)} />
        {label}
      </label>
    )
  }

  return (
    <Field label={label} htmlFor={id} required={field.required} hint={field.hint}>
      {field.kind === 'longtext' ? (
        <Textarea id={id} rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : field.kind === 'enum' ? (
        <Select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={id}
          type={
            field.kind === 'number'
              ? 'number'
              : field.kind === 'date'
                ? 'date'
                : field.kind === 'datetime'
                  ? 'datetime-local'
                  : 'text'
          }
          dir={field.kind === 'text' || field.kind === 'list' ? undefined : 'ltr'}
          value={
            field.kind === 'list'
              ? Array.isArray(value)
                ? value.join(', ')
                : (value ?? '')
              : field.kind === 'datetime' && typeof value === 'string' && value
                ? value.slice(0, 16)
                : (value ?? '')
          }
          onChange={(e) =>
            onChange(
              field.kind === 'datetime' && e.target.value
                ? new Date(e.target.value).toISOString()
                : e.target.value
            )
          }
        />
      )}
    </Field>
  )
}
