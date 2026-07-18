import { hexToRgb } from '../../../business-panel/utils/styles'
import type { StyleConfig } from '../../../business-panel/hooks/useOrganizationStyles'
import { generateOrganizationBrandingTheme } from '@/core/theme/organization-branding-theme'

export type OrganizationAuthStyles = Partial<StyleConfig>

/**
 * Los estilos de login almacenados representan la variante oscura histórica.
 * En modo claro generamos la superficie equivalente a partir de los colores
 * interactivos de la organización, conservando su branding sin dejar el modal
 * atrapado en fondos y textos oscuros.
 */
export function resolveOrganizationAuthStylesForMode(
  loginStyles: OrganizationAuthStyles | null,
  isDark: boolean,
): OrganizationAuthStyles | null {
  if (isDark) return loginStyles

  const lightLoginStyles = generateOrganizationBrandingTheme({
    color_primary: loginStyles?.primary_button_color,
    color_secondary: loginStyles?.secondary_button_color,
    color_accent: loginStyles?.accent_color,
  }).lightMode.login

  return {
    ...loginStyles,
    ...lightLoginStyles,
    primary_button_color:
      loginStyles?.primary_button_color || lightLoginStyles.primary_button_color,
    secondary_button_color:
      loginStyles?.secondary_button_color || lightLoginStyles.secondary_button_color,
    accent_color: loginStyles?.accent_color || lightLoginStyles.accent_color,
  }
}

export interface OrganizationAuthPalette {
  cardBg: string
  inputBgColor: string
  borderColor: string
  textColor: string
  primaryColor: string
  secondaryColor: string
  focusColor: string
  /**
   * Color para enlaces de texto sobre la tarjeta (p. ej. "¿Olvidaste tu
   * contraseña?"). NO usar `primaryColor` para esto: es el color del BOTÓN de
   * marca, pensado para ir de fondo con texto encima. Cuando la marca es oscura
   * (azul marino) y la tarjeta también lo es, el enlace se volvía ilegible.
   * El acento sí está diseñado para leerse sobre ambas superficies.
   */
  linkColor: string
  isDark: boolean
}

export function buildOrganizationAuthPalette(
  loginStyles: OrganizationAuthStyles | null,
  isDark: boolean,
): OrganizationAuthPalette {
  const defaultCardBg = isDark ? 'var(--color-legacy-1a1a2e)' : 'rgba(255, 255, 255, 0.9)'
  const defaultText = isDark ? 'var(--color-bg-light)' : 'var(--color-legacy-0f172a)'
  const defaultBorder = isDark
    ? 'rgba(71, 85, 105, 0.5)'
    : 'rgba(226, 232, 240, 0.8)'
  const cardBg = loginStyles?.card_background || defaultCardBg

  return {
    cardBg,
    inputBgColor: toInputBackgroundColor(cardBg, isDark),
    borderColor: loginStyles?.border_color || defaultBorder,
    textColor: loginStyles?.text_color || defaultText,
    primaryColor: loginStyles?.primary_button_color || 'var(--color-info)',
    secondaryColor: loginStyles?.secondary_button_color || 'var(--color-success)',
    focusColor: 'var(--color-accent)',
    linkColor: 'var(--color-accent)',
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

  if (cardBg.startsWith('var(')) {
    return `rgba(${hexToRgb(cardBg)}, ${isDark ? 0.5 : 0.05})`
  }

  return cardBg
}
