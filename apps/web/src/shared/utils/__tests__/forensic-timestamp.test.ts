import { describe, expect, it } from 'vitest'

import { formatForensicTimestamp } from '../forensic-timestamp'

describe('formatForensicTimestamp', () => {
  it('formats UTC with an explicit UTC label (matches the database)', () => {
    const out = formatForensicTimestamp('2026-07-18T14:38:03.000Z', 'utc')
    expect(out).toContain('2026')
    expect(out).toContain('14:38')
    expect(out).toContain('UTC')
  })

  it('returns em dash for null/invalid', () => {
    expect(formatForensicTimestamp(null, 'utc')).toBe('—')
    expect(formatForensicTimestamp('not-a-date', 'utc')).toBe('—')
  })

  it('always includes a timezone label so times are never ambiguous', () => {
    const local = formatForensicTimestamp('2026-07-18T14:38:03.000Z', 'local')
    // Alguna etiqueta de zona debe estar presente (GMT/UTC/abreviatura).
    expect(local).toMatch(/GMT|UTC|[A-Z]{2,4}/)
  })
})
