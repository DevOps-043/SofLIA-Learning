'use client'

import React from 'react'
import { hexToRgb } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import type { StyleConfig } from '../../../../../features/business-panel/contexts/OrganizationStylesContext'

interface ModernStatsCardProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  index: number
  onClick?: () => void
  isClickable?: boolean
  styles?: Partial<StyleConfig> | null
  id?: string
  disableHeavyEffects?: boolean
}

/**
 * ModernStatsCard - Simplified stats card without heavy animations
 * Uses CSS transitions instead of Framer Motion for better performance
 */
export function ModernStatsCard({
  label,
  value,
  icon: Icon,
  color,
  index,
  onClick,
  isClickable,
  styles,
  id,
  disableHeavyEffects = false,
}: ModernStatsCardProps) {
  const { resolvedTheme } = useThemeStore()
  const isSystemLight = resolvedTheme === 'light'

  const primaryColor = styles?.primary_button_color || 'var(--color-primary)'
  const accentColor = styles?.accent_color || 'var(--color-accent)' // Aqua from SofLIA Design System

  // Defaults adaptativos basados en el tema del sistema
  const defaultCardBg = isSystemLight ? 'var(--color-bg-light)' : 'var(--color-gray-800)'
  const defaultText = isSystemLight ? 'var(--color-legacy-0f172a)' : 'var(--color-bg-light)'
  const defaultBorder = isSystemLight ? 'var(--color-gray-200)' : 'var(--color-legacy-334155)'

  const cardBackground = styles?.card_background || defaultCardBg
  const textColor = styles?.text_color || defaultText
  const borderColor = styles?.border_color || defaultBorder
  const cardOpacity = styles?.card_opacity ?? 0.95

  // Determinar si estamos en modo claro basándonos en el color de fondo
  const isLightMode = cardBackground.toLowerCase() === 'var(--color-bg-light)' ||
    cardBackground.toLowerCase() === 'var(--color-gray-50)' ||
    cardBackground.startsWith('rgb(255') ||
    cardBackground.startsWith('rgba(255')

  // En modo oscuro, usar aqua para iconos (mejor visibilidad según SofLIA Design System)
  const iconColor = isLightMode ? primaryColor : accentColor

  // Calcular RGB para opacidad
  const cardBgRgb = hexToRgb(cardBackground)

  return (
    <div
      id={id}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[20px] p-4 sm:p-5 transition-all duration-300 scroll-mt-24 ${
        isClickable ? 'cursor-pointer hover:-translate-y-1' : ''
      }`}
      style={{
        backgroundColor: isLightMode ? 'var(--color-bg-light)' : 'rgba(20, 25, 30, 0.4)',
        backdropFilter: disableHeavyEffects ? undefined : 'blur(20px)',
        border: `1px solid ${isLightMode ? 'var(--color-gray-200)' : 'rgba(255, 255, 255, 0.06)'}`,
        boxShadow: isLightMode 
          ? (isClickable ? '0 10px 30px -10px rgba(0,0,0,0.08)' : '0 4px 20px -10px rgba(0,0,0,0.05)') 
          : (isClickable ? '0 10px 30px -10px rgba(0,0,0,0.3)' : 'none'),
        animationDelay: disableHeavyEffects ? undefined : `${index * 50}ms`
      }}
    >
      <div className="relative z-10 flex items-center gap-4">
        {/* Sleek icon wrapper */}
        <div
          className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl ${disableHeavyEffects ? '' : 'transition-transform duration-500 group-hover:scale-110'}`}
          style={{
             background: `linear-gradient(135deg, color-mix(in srgb, ${iconColor} 8.2%, transparent), transparent)`,
             border: `1px solid color-mix(in srgb, ${iconColor} 14.5%, transparent)`
          }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: iconColor }} />
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-center">
          <p 
            className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold mb-1 transition-opacity duration-300 group-hover:opacity-100" 
            style={{ color: isLightMode ? 'var(--color-gray-500)' : 'var(--color-legacy-858e9b)', opacity: 0.85 }}
          >
            {label}
          </p>
          <p 
            className="text-2xl sm:text-3xl font-extrabold leading-none tracking-tight" 
            style={{ color: textColor }}
          >
            {value}
          </p>
        </div>
      </div>

      {/* Subtle modern abstract glow */}
      {!disableHeavyEffects ? (
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-700 ease-out group-hover:opacity-40 group-hover:scale-110"
          style={{ backgroundColor: iconColor }}
        />
      ) : null}
    </div>
  )
}
