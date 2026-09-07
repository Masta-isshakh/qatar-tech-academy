import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Picks the English or Arabic variant of a bilingual field. */
export function pick(locale: string, en?: string | null, ar?: string | null) {
  const value = locale === 'ar' ? (ar ?? en) : (en ?? ar)
  return value ?? ''
}

/**
 * Prices always use Western digits, even in Arabic — that is the brand rule and
 * it is also how prices are written on Qatari invoices.
 */
export function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatDate(value: string | Date | null | undefined, locale: string) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-QA' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Qatar',
  }).format(date)
}

export function formatDateTime(value: string | Date | null | undefined, locale: string) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-QA' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Qatar',
  }).format(date)
}

/** `+974 3312 3456` → `9743312 3456`-safe digits for wa.me links. */
export function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Escapes a value for a CSV cell (RFC 4180). */
export function csvCell(value: unknown) {
  const s = value === null || value === undefined ? '' : String(value)
  // A leading =, +, - or @ makes spreadsheet apps evaluate the cell as a formula.
  const guarded = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${guarded.replace(/"/g, '""')}"`
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]) {
  const header = columns.map(csvCell).join(',')
  const body = rows.map((row) => columns.map((c) => csvCell(row[c])).join(','))
  return [header, ...body].join('\r\n')
}
