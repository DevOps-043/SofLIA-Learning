import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BRAND_PRIMARY,
  normalizeBrandHexColor,
  resolveBrandHexColor,
} from '../admin-companies/admin-company-brand-colors'

describe('admin-company-brand-colors', () => {
  it('normalizes direct HEX values for color inputs and API payloads', () => {
    expect(resolveBrandHexColor('#ABC')).toBe('#aabbcc')
    expect(resolveBrandHexColor('#AABBCC')).toBe('#aabbcc')
  })

  it('resolves current and legacy CSS color tokens to HEX values', () => {
    expect(resolveBrandHexColor('var(--color-info)')).toBe(DEFAULT_BRAND_PRIMARY)
    expect(resolveBrandHexColor('var(--color-legacy-1e40af)')).toBe('#1e40af')
  })

  it('returns the provided fallback for invalid or empty values', () => {
    expect(normalizeBrandHexColor('', DEFAULT_BRAND_PRIMARY)).toBe(DEFAULT_BRAND_PRIMARY)
    expect(normalizeBrandHexColor('not-a-color', DEFAULT_BRAND_PRIMARY)).toBe(DEFAULT_BRAND_PRIMARY)
  })
})
