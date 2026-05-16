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
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1E2329]">
      <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-white/5">
        <div className="flex items-center gap-4">
          {Icon ? <CompanyEditCardIcon icon={Icon} iconColor={iconColor} usesThemeActionColor={usesThemeActionColor} /> : null}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description ? <p className="text-sm text-gray-500 dark:text-[#8899A6]">{description}</p> : null}
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
      className={`rounded-xl p-3 ${usesThemeActionColor ? 'bg-[#0A2540]/10 dark:bg-[#00D4B3]/15' : ''}`}
      style={usesThemeActionColor ? undefined : { backgroundColor: `${iconColor}15` }}
    >
      <Icon
        className={`h-5 w-5 ${usesThemeActionColor ? 'text-[#0A2540] dark:text-[#00D4B3]' : ''}`}
        style={usesThemeActionColor ? undefined : { color: iconColor }}
      />
    </div>
  )
}
