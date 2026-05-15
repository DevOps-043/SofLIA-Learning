'use client'

import { Plus, SearchX, SlidersHorizontal } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminUsersEmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
  onAddClick: () => void
  t: TFunction<'admin'>
}

export function AdminUsersEmptyState({
  hasFilters,
  onClearFilters,
  onAddClick,
  t,
}: AdminUsersEmptyStateProps) {
  const theme = useAdminPanelTheme()
  const Icon = hasFilters ? SlidersHorizontal : SearchX

  return (
    <div
      className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border px-6 py-14 text-center shadow-sm"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          color: theme.primaryColor,
        }}
      >
        <Icon className="h-9 w-9" />
      </div>
      <h3 className="text-xl font-extrabold" style={{ color: theme.textColor }}>
        {t('users.page.empty.title')}
      </h3>
      <p className="mt-2 max-w-md text-sm font-medium" style={{ color: theme.subtextColor }}>
        {hasFilters ? t('users.page.empty.searchFilter') : t('users.page.empty.noUsers')}
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-bold transition-colors"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          >
            {t('users.page.empty.clearFilters')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-colors"
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.onPrimaryColor,
            boxShadow: `0 10px 24px ${theme.primaryColor}24`,
          }}
        >
          <Plus className="h-4 w-4" />
          {t('users.page.addUser')}
        </button>
      </div>
    </div>
  )
}
