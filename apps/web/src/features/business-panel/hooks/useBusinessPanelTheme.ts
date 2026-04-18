'use client'

import { useMemo } from 'react'
import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

/**
 * Tokens de color centralizados para el Business Panel.
 *
 * REGLA: Ningún componente del business-panel debe calcular colores con
 * `isDark ? '#hex' : '#hex'` de forma local. Deben consumir este hook.
 *
 * Jerarquía de prioridad:
 *   1. Colores de la organización (OrganizationStylesContext) — modo claro
 *   2. Paleta del design system (#00D4B3, #0A2540, etc.) — modo oscuro y fallbacks
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

export function useBusinessPanelTheme(): BusinessPanelThemeTokens {
  const { resolvedTheme } = useThemeStore()
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const isDark = resolvedTheme === 'dark'

  return useMemo<BusinessPanelThemeTokens>(() => {
    // En modo oscuro el color primario de acción siempre es el acento (#00D4B3)
    // para mantener contraste sobre fondos oscuros, independiente de la org.
    const brandColor = panelStyles?.primary_button_color ?? '#0A2540'
    const actionColor = isDark ? '#00D4B3' : brandColor
    const onActionColor = isDark ? '#04130F' : '#FFFFFF'
    const actionSurface = isDark ? 'rgba(0,212,179,0.12)' : 'rgba(10,37,64,0.08)'

    // Acciones, iconos y textos destacados de UI siguen el modo:
    // claro = azul profundo, oscuro = aqua.
    const accentColor = actionColor

    const secondaryColor = panelStyles?.secondary_button_color ?? '#8B5CF6'

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
      textColor: isDark
        ? (panelStyles?.text_color ?? '#FFFFFF')
        : '#0F172A',
      subtextColor: isDark ? '#858E9B' : '#475569',
      mutedTextColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)',
      inverseTextColor: '#FFFFFF',
      inverseSubtextColor: 'rgba(255,255,255,0.82)',
      inverseMutedTextColor: 'rgba(255,255,255,0.62)',

      // Superficies
      cardBg: isDark
        ? (panelStyles?.card_background ?? 'rgba(30, 35, 41, 0.6)')
        : '#FFFFFF',
      inputBg: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
      panelBg: isDark ? '#0b0e14' : '#FFFFFF',
      hoverBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)',
      overlayBg: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.45)',
      inverseSurface: 'rgba(255,255,255,0.08)',
      inverseBorderColor: 'rgba(255,255,255,0.18)',
      heroBackground: isDark
        ? 'linear-gradient(135deg, rgba(10,37,64,0.82) 0%, rgba(15,20,25,0.95) 55%, rgba(0,212,179,0.18) 100%)'
        : 'linear-gradient(135deg, rgba(10,37,64,0.95) 0%, rgba(15,23,42,0.88) 52%, rgba(0,212,179,0.30) 100%)',
      heroBorderColor: isDark ? 'rgba(0,212,179,0.12)' : 'rgba(0,212,179,0.18)',

      // Bordes
      borderColor: isDark
        ? (panelStyles?.border_color ?? 'rgba(255,255,255,0.06)')
        : 'rgba(0,0,0,0.06)',
      dividerColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',

      // Roles
      roleColors: {
        owner: { text: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
        admin: {
          text: brandColor,
          bg: isDark ? 'rgba(10,37,64,0.26)' : 'rgba(10,37,64,0.1)',
        },
        member: {
          text: actionColor,
          bg: actionSurface,
        },
      },

      // Estatus
      statusColors: {
        active: '#10B981',
        invited: '#F59E0B',
        suspended: '#EF4444',
        removed: '#6B7280',
      },

      // Semánticos (invariantes de tema)
      chartColors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'],

      difficultyColors: {
        beginner: '#22C55E',
        intermediate: '#EAB308',
        advanced: '#EF4444',
        default: '#3B82F6',
      },

      successColor: '#10B981',
      dangerColor: '#EF4444',
      warningColor: '#F59E0B',
    }
  }, [isDark, panelStyles])
}
