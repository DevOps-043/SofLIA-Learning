import type { CSSProperties } from 'react'

export interface PremiumControlPalette {
  accentColor: string
  borderColor: string
  inputBg: string
  menuBg?: string
  mutedText: string
  onPrimaryColor: string
  primaryColor: string
  surfaceColor: string
  textColor: string
}

export interface PremiumSelectOption {
  description?: string
  label: string
  value: string
}

export function getPremiumControlStyle(
  palette: PremiumControlPalette,
): CSSProperties {
  return {
    '--premium-control-accent': palette.accentColor,
    '--premium-control-border': palette.borderColor,
    '--premium-control-input': palette.inputBg,
    '--premium-control-menu': palette.menuBg ?? palette.surfaceColor,
    '--premium-control-muted': palette.mutedText,
    '--premium-control-on-primary': palette.onPrimaryColor,
    '--premium-control-primary': palette.primaryColor,
    '--premium-control-surface': palette.surfaceColor,
    '--premium-control-text': palette.textColor,
  } as CSSProperties
}
