'use client'

import { useMemo } from 'react'
import { useThemeStore } from '@/core/stores/themeStore'
import {
  adjustColorForContrast,
  chooseReadableTextColor,
  getContrastRatio,
  resolveHexColor,
} from '@/core/theme/color-engine'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

/**
 * Tokens de color centralizados para el Business Panel.
 *
 * REGLA: Ningún componente del business-panel debe calcular colores con
 * `isDark ? '#hex' : '#hex'` de forma local. Deben consumir este hook.
 *
 * Jerarquía de prioridad:
 *   1. Colores de la organización (OrganizationStylesContext) — modo claro
 *   2. Paleta del design system solo como fallback
 */
export interface BusinessPanelThemeTokens {
  // ─── Identidad ───────────────────────────────────────────────────
  isDark: boolean

  // Colores de marca (respetan personalización de la organización)
  brandColor: string
  actionColor: string
  onActionColor: string
  actionSurface: string
  primaryColor: string
  onPrimaryColor: string
  accentColor: string
  secondaryColor: string

  // ─── Texto ───────────────────────────────────────────────────────
  /** Texto principal: blanco oscuro / gris oscuro */
  textColor: string
  /** Texto secundario / subtítulos */
  subtextColor: string
  /** Texto muy atenuado, etiquetas, metadatos */
  mutedTextColor: string
  inverseTextColor: string
  inverseSubtextColor: string
  inverseMutedTextColor: string

  // ─── Superficies ─────────────────────────────────────────────────
  /** Fondo de tarjetas/modales */
  cardBg: string
  /** Fondo de inputs y áreas de contenido secundario */
  inputBg: string
  /** Fondo del panel general (sidebar, shells) */
  panelBg: string
  /** Fondo sutil para hover, chips y estados neutros */
  hoverBg: string
  /** Fondo para overlays/modales */
  overlayBg: string
  inverseSurface: string
  inverseBorderColor: string
  heroBackground: string
  heroBorderColor: string

  // ─── Bordes ──────────────────────────────────────────────────────
  /** Borde sutil de tarjetas */
  borderColor: string
  /** Borde más visible para separadores */
  dividerColor: string

  // ─── Estados de rol ──────────────────────────────────────────────
  roleColors: {
    owner: { text: string; bg: string }
    admin: { text: string; bg: string }
    member: { text: string; bg: string }
  }

  // ─── Estados de usuario ──────────────────────────────────────────
  statusColors: {
    active: string
    invited: string
    suspended: string
    removed: string
  }

  chartColors: string[]

  difficultyColors: {
    beginner: string
    intermediate: string
    advanced: string
    default: string
  }

  // ─── Semánticos globales (no cambian con el tema) ─────────────────
  /** Verde éxito */
  successColor: string
  /** Rojo peligro/error */
  dangerColor: string
  /** Amarillo advertencia */
  warningColor: string
}

const MIN_ACTION_SURFACE_CONTRAST = 3

export function resolveBusinessPanelActionColor(options: {
  primaryColor: string
  accentColor: string
  surfaceColor: string
}): string {
  const surfaceColor = resolveHexColor(options.surfaceColor) ?? DESIGN_HEX_COLOR.bgDark
  const primaryColor = resolveHexColor(options.primaryColor)
  if (primaryColor && getContrastRatio(primaryColor, surfaceColor) >= MIN_ACTION_SURFACE_CONTRAST) {
    return primaryColor
  }

  const accentColor = resolveHexColor(options.accentColor)
  if (accentColor && getContrastRatio(accentColor, surfaceColor) >= MIN_ACTION_SURFACE_CONTRAST) {
    return accentColor
  }

  return adjustColorForContrast(
    primaryColor ?? options.primaryColor,
    surfaceColor,
    MIN_ACTION_SURFACE_CONTRAST,
  )
}

export function useBusinessPanelTheme(): BusinessPanelThemeTokens {
  const { resolvedTheme } = useThemeStore()
  const { effectiveStyles, styles } = useOrganizationStylesContext()
  const panelStyles = effectiveStyles?.panel || styles?.panel
  const isDark = resolvedTheme === 'dark'

  return useMemo<BusinessPanelThemeTokens>(() => {
    const brandColor = panelStyles?.primary_button_color ?? 'var(--color-primary)'
    const accentColor = panelStyles?.accent_color ?? brandColor
    const secondaryColor = panelStyles?.secondary_button_color ?? 'var(--color-secondary)'
    const surfaceColor = panelStyles?.sidebar_background
      ?? panelStyles?.card_background
      ?? (isDark ? DESIGN_HEX_COLOR.bgDark : DESIGN_HEX_COLOR.bgLight)
    const actionColor = resolveBusinessPanelActionColor({
      primaryColor: brandColor,
      accentColor,
      surfaceColor,
    })
    const onActionColor = chooseReadableTextColor(actionColor)
    const actionSurface = `color-mix(in srgb, ${actionColor} ${isDark ? 12 : 8}%, transparent)`

    // Acciones, iconos y textos destacados de UI siguen el modo:
    // claro = azul profundo, oscuro = aqua.
    return {
      isDark,
      brandColor,
      actionColor,
      onActionColor,
      actionSurface,
      primaryColor: actionColor,
      onPrimaryColor: onActionColor,
      accentColor,
      secondaryColor,

      // Texto
      textColor: panelStyles?.text_color ?? 'var(--color-contrast)',
      subtextColor: 'var(--color-muted)',
      mutedTextColor: `color-mix(in srgb, var(--color-contrast) ${isDark ? 40 : 50}%, transparent)`,
      inverseTextColor: 'var(--color-bg-light)',
      inverseSubtextColor: 'color-mix(in srgb, var(--color-bg-light) 82%, transparent)',
      inverseMutedTextColor: 'color-mix(in srgb, var(--color-bg-light) 62%, transparent)',

      // Superficies
      cardBg: isDark
        ? (panelStyles?.card_background ?? 'var(--color-gray-800)')
        : (panelStyles?.card_background ?? 'var(--color-bg-light)'),
      inputBg: `color-mix(in srgb, var(--color-contrast) ${isDark ? 3 : 4}%, transparent)`,
      panelBg: isDark
        ? (panelStyles?.sidebar_background ?? 'var(--color-bg-dark)')
        : (panelStyles?.sidebar_background ?? 'var(--color-bg-light)'),
      hoverBg: `color-mix(in srgb, var(--color-contrast) ${isDark ? 8 : 5}%, transparent)`,
      overlayBg: 'color-mix(in srgb, var(--color-black) 55%, transparent)',
      inverseSurface: 'color-mix(in srgb, var(--color-bg-light) 8%, transparent)',
      inverseBorderColor: 'color-mix(in srgb, var(--color-bg-light) 18%, transparent)',
      heroBackground: `linear-gradient(135deg, color-mix(in srgb, ${actionColor} ${isDark ? 82 : 95}%, transparent) 0%, color-mix(in srgb, ${actionColor} ${isDark ? 55 : 88}%, var(--color-black)) 55%, color-mix(in srgb, ${accentColor} ${isDark ? 18 : 30}%, transparent) 100%)`,
      heroBorderColor: `color-mix(in srgb, ${accentColor} ${isDark ? 12 : 18}%, transparent)`,

      // Bordes
      borderColor: isDark
        ? (panelStyles?.border_color ?? 'color-mix(in srgb, var(--color-bg-light) 6%, transparent)')
        : (panelStyles?.border_color ?? 'color-mix(in srgb, var(--color-black) 6%, transparent)'),
      dividerColor: `color-mix(in srgb, ${isDark ? 'var(--color-bg-light)' : 'var(--color-black)'} 10%, transparent)`,

      // Roles
      roleColors: {
        owner: { text: 'var(--color-secondary)', bg: 'color-mix(in srgb, var(--color-secondary) 12%, transparent)' },
        admin: {
          text: isDark ? 'var(--color-info)' : brandColor,
          bg: `color-mix(in srgb, ${isDark ? 'var(--color-info)' : brandColor} ${isDark ? 16 : 10}%, transparent)`,
        },
        member: {
          text: actionColor,
          bg: actionSurface,
        },
      },

      // Estatus
      statusColors: {
        active: 'var(--color-success)',
        invited: 'var(--color-warning)',
        suspended: 'var(--color-error)',
        removed: 'var(--color-muted)',
      },

      // Semánticos (invariantes de tema)
      chartColors: [actionColor, secondaryColor, accentColor, 'var(--color-success)', 'var(--color-warning)', 'var(--color-error)'],

      difficultyColors: {
        beginner: 'var(--color-success)',
        intermediate: 'var(--color-warning)',
        advanced: 'var(--color-error)',
        default: 'var(--color-info)',
      },

      successColor: 'var(--color-success)',
      dangerColor: 'var(--color-error)',
      warningColor: 'var(--color-warning)',
    }
  }, [isDark, panelStyles])
}
