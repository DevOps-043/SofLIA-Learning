import { describe, expect, it, vi } from 'vitest'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import { getContrastRatio } from '@/core/theme/color-engine'
import { resolveBusinessPanelActionColor } from '../useBusinessPanelTheme'

vi.mock('@/core/stores/themeStore', () => ({
  useThemeStore: vi.fn(),
}))

describe('resolveBusinessPanelActionColor', () => {
  it('uses a readable organization accent instead of forcing the SofLIA accent in dark mode', () => {
    const actionColor = resolveBusinessPanelActionColor({
      primaryColor: DESIGN_HEX_COLOR.black,
      accentColor: '#8ed1fc',
      surfaceColor: DESIGN_HEX_COLOR.black,
    })

    expect(actionColor).toBe('#8ed1fc')
    expect(actionColor).not.toBe(DESIGN_HEX_COLOR.accent)
  })

  it('adjusts the primary color when neither primary nor accent has enough contrast', () => {
    const surfaceColor = '#101010'
    const actionColor = resolveBusinessPanelActionColor({
      primaryColor: '#050505',
      accentColor: '#121212',
      surfaceColor,
    })

    expect(actionColor).not.toBe('#050505')
    expect(actionColor).not.toBe('#121212')
    expect(getContrastRatio(actionColor, surfaceColor)).toBeGreaterThanOrEqual(3)
  })
})
