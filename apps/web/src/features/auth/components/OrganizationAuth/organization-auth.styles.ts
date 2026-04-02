import { hexToRgb } from '../../../business-panel/utils/styles'

export interface OrganizationAuthStyles {
  primary_button_color?: string
  secondary_button_color?: string
  card_background?: string
  text_color?: string
  border_color?: string
}

export interface OrganizationAuthPalette {
  cardBg: string
  inputBgColor: string
  borderColor: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  focusColor: string
  isDark: boolean
}

export function buildOrganizationAuthPalette(
  loginStyles: OrganizationAuthStyles | null,
  isDark: boolean,
): OrganizationAuthPalette {
  const defaultCardBg = isDark ? '#1a1a2e' : 'rgba(255, 255, 255, 0.9)'
  const defaultText = isDark ? '#ffffff' : '#0f172a'
  const defaultBorder = isDark
    ? 'rgba(71, 85, 105, 0.5)'
    : 'rgba(226, 232, 240, 0.8)'
  const cardBg = loginStyles?.card_background || defaultCardBg

  return {
    cardBg,
    inputBgColor: toInputBackgroundColor(cardBg, isDark),
    borderColor: loginStyles?.border_color || defaultBorder,
    textColor: loginStyles?.text_color || defaultText,
    primaryColor: loginStyles?.primary_button_color || '#3b82f6',
    secondaryColor: loginStyles?.secondary_button_color || '#10b981',
    focusColor: '#00D4B3',
    isDark,
  }
}

export function toInputBackgroundColor(cardBg: string, isDark: boolean): string {
  if (cardBg.startsWith('#')) {
    return `rgba(${hexToRgb(cardBg)}, ${isDark ? 0.5 : 0.05})`
  }

  if (cardBg.startsWith('rgba')) {
    return cardBg.replace(/rgba?\(([^)]+)\)/, (_match, values: string) => {
      const [red, green, blue] = values
        .split(',')
        .map((value: string) => value.trim())
      return `rgba(${red}, ${green}, ${blue}, ${isDark ? 0.5 : 0.05})`
    })
  }

  return cardBg
}
