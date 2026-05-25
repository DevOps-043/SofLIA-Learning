'use client'

import { type ReactNode } from 'react'

import type { BusinessUsersTheme } from './users-page.types'

interface ManagementTabEmptyStateProps {
  description: string
  icon: ReactNode
  theme: BusinessUsersTheme
  title: string
}

export function ManagementTabEmptyState({
  theme,
  icon,
  title,
  description,
}: ManagementTabEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-3xl border p-20 text-center"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="mb-4" style={{ color: theme.mutedTextColor }}>
        {icon}
      </div>
      <h3 className="text-xl font-bold" style={{ color: theme.textColor }}>
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: theme.subtextColor }}>
        {description}
      </p>
    </div>
  )
}
