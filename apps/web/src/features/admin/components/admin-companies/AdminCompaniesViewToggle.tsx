'use client'

import { LayoutGrid, List } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

export type CompaniesViewMode = 'grid' | 'list'

interface AdminCompaniesViewToggleProps {
  viewMode: CompaniesViewMode
  onViewModeChange: (mode: CompaniesViewMode) => void
}

export function AdminCompaniesViewToggle({ viewMode, onViewModeChange }: AdminCompaniesViewToggleProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  const buttons = [
    { mode: 'grid' as const, icon: LayoutGrid, label: t('companies.filters.gridView') },
    { mode: 'list' as const, icon: List, label: t('companies.filters.listView') },
  ]

  return (
    <div
      className="flex h-[50px] items-center gap-0.5 rounded-2xl border p-1"
      style={{
        backgroundColor: theme.inputBg,
        borderColor: theme.borderColor,
      }}
    >
      {buttons.map(({ mode, icon: Icon, label }) => {
        const isActive = viewMode === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className="relative flex h-full items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all"
            style={{
              color: isActive ? theme.primaryColor : theme.subtextColor,
            }}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId="admin-companies-view-toggle"
                className="absolute inset-0 rounded-xl border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                  boxShadow: theme.isDark
                    ? '0 2px 8px -2px rgba(0,0,0,0.4)'
                    : '0 2px 8px -2px rgba(15,23,42,0.1)',
                }}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10 hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
