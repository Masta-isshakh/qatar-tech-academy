import { describe, expect, it } from 'vitest'
import { csvCell, formatPrice, pick, toCsv, slugify } from '@/lib/utils'
import { markdownToHtml } from '@/lib/markdown'
import { corporateDiscountFor } from '@/data/seed-content'
import { leadSchema, registrationSchema } from '@/lib/validation'

describe('pick', () => {
  it('returns the Arabic variant for ar and English otherwise', () => {
    expect(pick('ar', 'Robotics', 'الروبوتات')).toBe('الروبوتات')
    expect(pick('en', 'Robotics', 'الروبوتات')).toBe('Robotics')
  })

  it('falls back to the other language when one is missing', () => {
    expect(pick('ar', 'Robotics', '')).toBe('Robotics')
    expect(pick('en', '', 'الروبوتات')).toBe('الروبوتات')
    expect(pick('ar', null, null)).toBe('')
  })
})

describe('formatPrice', () => {
  it('always uses Western digits, even for Arabic pages', () => {
    expect(formatPrice(9000)).toBe('9,000')
    expect(formatPrice(12000)).toBe('12,000')
  })
})

describe('csv', () => {
  it('escapes quotes and neutralises formula injection', () => {
    expect(csvCell('a "b"')).toBe('"a ""b"""')
    expect(csvCell('=cmd|calc')).toBe(`"'=cmd|calc"`)
    expect(csvCell(null)).toBe('""')
  })

  it('emits a header row and CRLF line endings', () => {
    const csv = toCsv([{ a: 1, b: 'x' }], ['a', 'b'])
    expect(csv).toBe('"a","b"\r\n"1","x"')
  })
})

describe('slugify', () => {
  it('keeps Arabic letters and strips punctuation', () => {
    expect(slugify('Robotics & Drones')).toBe('robotics-drones')
    expect(slugify('الروبوتات والدرونز')).toBe('الروبوتات-والدرونز')
  })
})

describe('markdownToHtml', () => {
  it('renders headings, lists and emphasis', () => {
    const html = markdownToHtml('## Title\n\n- one\n- two\n\nSome **bold** text.')
    expect(html).toContain('<h2>Title</h2>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('escapes raw HTML instead of passing it through', () => {
    const html = markdownToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('drops javascript: links but keeps https ones', () => {
    expect(markdownToHtml('[x](javascript:alert(1))')).not.toContain('href')
    expect(markdownToHtml('[x](https://example.com)')).toContain('href="https://example.com"')
  })
})

describe('corporateDiscountFor', () => {
  it('applies the highest tier the seat count reaches', () => {
    expect(corporateDiscountFor(5)).toBe(0)
    expect(corporateDiscountFor(10)).toBe(0.1)
    expect(corporateDiscountFor(25)).toBe(0.15)
    expect(corporateDiscountFor(100)).toBe(0.25)
  })
})

describe('validation', () => {
  const validRegistration = {
    name: 'Abdulla Al-Marri',
    phone: '+974 3312 3456',
    email: 'a@example.com',
    occupation: 'STUDENT' as const,
    trackSlug: 'robotics',
    consent: true as const,
    locale: 'ar' as const,
  }

  it('accepts a complete registration', () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true)
  })

  it('rejects a registration without consent', () => {
    expect(registrationSchema.safeParse({ ...validRegistration, consent: false }).success).toBe(
      false
    )
  })

  it('rejects a phone number that is too short to dial', () => {
    expect(registrationSchema.safeParse({ ...validRegistration, phone: '123' }).success).toBe(false)
  })

  it('rejects a filled honeypot on leads', () => {
    const base = { name: 'Bot', phone: '+97433123456', locale: 'ar' as const, source: 'web' }
    expect(leadSchema.safeParse(base).success).toBe(true)
    expect(leadSchema.safeParse({ ...base, website: 'http://spam' }).success).toBe(false)
  })
})
