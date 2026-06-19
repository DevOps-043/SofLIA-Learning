import { describe, expect, it } from 'vitest'
import { DESIGN_HEX_COLOR } from '../color-tokens'
import {
  adjustColorForContrast,
  chooseReadableTextColor,
  getContrastRatio,
  mixHexColors,
  normalizeHexColor,
  resolveHexColor,
} from '../color-engine'

describe('color-engine', () => {
  it('normalizes direct, shorthand, token and legacy colors', () => {
    expect(resolveHexColor('#ABC')).toBe('#aabbcc')
    expect(resolveHexColor('var(--color-info)')).toBe(DESIGN_HEX_COLOR.info)
    expect(resolveHexColor('var(--color-legacy-112233)')).toBe('#112233')
    expect(normalizeHexColor('not-a-color', DESIGN_HEX_COLOR.accent)).toBe(DESIGN_HEX_COLOR.accent)
  })

  it('mixes colors and calculates WCAG contrast', () => {
    expect(mixHexColors(DESIGN_HEX_COLOR.black, DESIGN_HEX_COLOR.bgLight, 0.5)).toBe('#808080')
    expect(getContrastRatio(DESIGN_HEX_COLOR.black, DESIGN_HEX_COLOR.bgLight)).toBeCloseTo(21, 1)
  })

  it('chooses readable foregrounds and adjusts low-contrast colors', () => {
    expect(chooseReadableTextColor(DESIGN_HEX_COLOR.accent)).toBe(DESIGN_HEX_COLOR.slate900)

    const adjusted = adjustColorForContrast(
      DESIGN_HEX_COLOR.bgLight,
      DESIGN_HEX_COLOR.bgLight,
      3,
      'darken',
    )

    expect(getContrastRatio(adjusted, DESIGN_HEX_COLOR.bgLight)).toBeGreaterThanOrEqual(3)
  })
})
