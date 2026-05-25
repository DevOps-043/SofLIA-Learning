'use client'

import type { ElementType, ReactNode } from 'react'
import { colors } from './shared-colors'

interface CompanyEditCardProps {
  title: string
  description?: string
  icon?: ElementType
  iconColor?: string
  children: ReactNode
  actions?: ReactNode
}

export function CompanyEditCard({
  title,
  description,
  icon: Icon,
  iconColor = colors.accent,
  children,
  actions,
}: CompanyEditCardProps) {
  const usesThemeActionColor = iconColor === colors.accent

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-carbon-800">
      <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-white/5">
        <div className="flex items-center gap-4">
          {Icon ? <CompanyEditCardIcon icon={Icon} iconColor={iconColor} usesThemeActionColor={usesThemeActionColor} /> : null}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description ? <p className="text-sm text-gray-500 dark:text-muted">{description}</p> : null}
          </div>
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function CompanyEditCardIcon({
  icon: Icon,
  iconColor,
  usesThemeActionColor,
}: {
  icon: ElementType
  iconColor: string
  usesThemeActionColor: boolean
}) {
  return (
    <div
      className={`rounded-xl p-3 ${usesThemeActionColor ? 'bg-primary/10 dark:bg-accent/15' : ''}`}
      style={usesThemeActionColor ? undefined : { backgroundColor: `color-mix(in srgb, ${iconColor} 8.2%, transparent)` }}
    >
      <Icon
        className={`h-5 w-5 ${usesThemeActionColor ? 'text-primary dark:text-accent' : ''}`}
        style={usesThemeActionColor ? undefined : { color: iconColor }}
      />
    </div>
  )
}
