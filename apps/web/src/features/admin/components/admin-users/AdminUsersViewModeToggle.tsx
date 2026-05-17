'use client'

import { LayoutGrid, List } from 'lucide-react'
import type { TFunction } from 'i18next'

import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminUsersViewMode } from './types'

interface AdminUsersViewModeToggleProps {
  value: AdminUsersViewMode
  onChange: (value: AdminUsersViewMode) => void
  t: TFunction<'admin'>
}

const VIEW_MODE_OPTIONS = [
  {
    value: 'cards' as const,
    labelKey: 'users.page.view.cards',
    icon: LayoutGrid,
  },
  {
    value: 'list' as const,
    labelKey: 'users.page.view.list',
    icon: List,
  },
]

export function AdminUsersViewModeToggle({
  value,
  onChange,
  t,
}: AdminUsersViewModeToggleProps) {
  const theme = useAdminPanelTheme()

  return (
    <div
      className="grid h-[50px] grid-cols-2 rounded-2xl border p-1"
      style={{
        backgroundColor: theme.inputBg,
        borderColor: theme.borderColor,
      }}
    >
      {VIEW_MODE_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = value === option.value
        const label = t(option.labelKey)

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="flex h-10 min-w-[46px] items-center justify-center rounded-xl transition-all"
            style={{
              backgroundColor: isActive ? theme.primaryColor : 'transparent',
              color: isActive ? theme.onPrimaryColor : theme.mutedTextColor,
              boxShadow: isActive ? `0 8px 20px ${theme.primaryColor}25` : 'none',
            }}
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
