'use client'

import React from 'react'
import { hexToRgb } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import type { StyleConfig } from '../../../../../features/business-panel/contexts/OrganizationStylesContext'

interface ModernStatsCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  index: number
  onClick?: () => void
  isClickable?: boolean
  styles?: Partial<StyleConfig> | null
  id?: string
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
  id
}: ModernStatsCardProps) {
  const { resolvedTheme } = useThemeStore()
  const isSystemLight = resolvedTheme === 'light'

  const primaryColor = styles?.primary_button_color || '#0A2540'
  const accentColor = styles?.accent_color || '#00D4B3' // Aqua from SofLIA Design System

  // Defaults adaptativos basados en el tema del sistema
  const defaultCardBg = isSystemLight ? '#FFFFFF' : '#1E2329'
  const defaultText = isSystemLight ? '#0F172A' : '#FFFFFF'
  const defaultBorder = isSystemLight ? '#E2E8F0' : '#334155'

  const cardBackground = styles?.card_background || defaultCardBg
  const textColor = styles?.text_color || defaultText
  const borderColor = styles?.border_color || defaultBorder
  const cardOpacity = styles?.card_opacity ?? 0.95

  // Determinar si estamos en modo claro basándonos en el color de fondo
  const isLightMode = cardBackground.toLowerCase() === '#ffffff' ||
    cardBackground.toLowerCase() === '#f8fafc' ||
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
      className={`
        relative overflow-hidden rounded-2xl p-5
        backdrop-blur-xl
        transition-all duration-300 scroll-mt-24
        ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}
      `}
      style={{
        backgroundColor: `rgba(${cardBgRgb}, ${cardOpacity})`,
        border: `1px solid ${isLightMode ? borderColor : 'rgba(255, 255, 255, 0.1)'}`,
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}20)`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${iconColor}25, ${iconColor}10)`,
              border: `1px solid ${iconColor}30`
            }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        </div>

        <p
          className="text-3xl font-bold mb-1"
          style={{ color: textColor }}
        >
          {value}
        </p>
        <p
          className="text-sm"
          style={{ color: isLightMode ? '#64748B' : '#9CA3AF' }}
        >
          {label}
        </p>
      </div>

      {/* Border gradient */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30, transparent, ${primaryColor}15)`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />
    </div>
  )
}
