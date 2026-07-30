'use client'

import React, { type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import type { StyleConfig } from '../../../../../features/business-panel/contexts/OrganizationStylesContext'
import { chooseReadableTextColor } from '@/core/theme/color-engine'
import dashboardStyles from '../page-components/BusinessUserDashboard.module.css'

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
  color: _color,
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
  const accentColor = styles?.accent_color || primaryColor

  // Defaults adaptativos basados en el tema del sistema
  const defaultCardBg = isSystemLight ? 'var(--color-bg-light)' : 'var(--color-gray-800)'
  const defaultText = isSystemLight ? 'var(--color-legacy-0f172a)' : 'var(--color-bg-light)'
  const defaultBorder = isSystemLight ? 'var(--color-gray-200)' : 'var(--color-legacy-334155)'

  const cardBackground = styles?.card_background || defaultCardBg
  const textColor = styles?.text_color || defaultText
  const borderColor = styles?.border_color || defaultBorder
  const iconColor = isSystemLight ? primaryColor : accentColor
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isClickable || !onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }
  const cardStyle = {
    '--dashboard-primary': iconColor,
    '--dashboard-accent': accentColor,
    '--dashboard-text': textColor,
    '--dashboard-muted': isSystemLight
      ? 'var(--color-gray-500)'
      : 'var(--color-legacy-9ca3af)',
    '--dashboard-surface': cardBackground,
    '--dashboard-border': borderColor,
    '--dashboard-on-action': chooseReadableTextColor(primaryColor),
    animationDelay: disableHeavyEffects ? undefined : `${index * 50}ms`,
  } as CSSProperties

  return (
    <article
      id={id}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={`${dashboardStyles.statCard} ${isClickable ? dashboardStyles.statCardInteractive : ''}`}
      style={cardStyle}
    >
      <div className={dashboardStyles.statTop}>
        <span className={dashboardStyles.statIcon}>
          <Icon className="h-4 w-4" />
        </span>
        {isClickable ? <ArrowUpRight className="h-4 w-4 opacity-45" /> : null}
      </div>
      <p className={dashboardStyles.statValue}>{value}</p>
      <p className={dashboardStyles.statLabel}>{label}</p>
    </article>
  )
}
