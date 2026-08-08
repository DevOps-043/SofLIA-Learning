'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminUsersPaginationProps {
  page: number
  totalPages: number
  total: number
  /** Filas realmente pintadas: la ultima pagina suele venir incompleta. */
  pageSize: number
  isBusy: boolean
  onPageChange: (page: number) => void
  t: TFunction<'admin'>
}

export function AdminUsersPagination({
  page,
  totalPages,
  total,
  pageSize,
  isBusy,
  onPageChange,
  t,
}: AdminUsersPaginationProps) {
  const theme = useAdminPanelTheme()

  if (totalPages <= 1) return null

  const canGoBack = page > 1 && !isBusy
  const canGoForward = page < totalPages && !isBusy
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const buttonStyle = (enabled: boolean) => ({
    backgroundColor: theme.inputBg,
    borderColor: theme.borderColor,
    color: enabled ? theme.textColor : theme.subtextColor,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.5,
  })

  return (
    <nav
      aria-label={t('users.page.pagination.label')}
      className="flex flex-col items-center justify-between gap-4 rounded-[24px] border px-5 py-4 sm:flex-row"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <p className="text-sm font-medium" style={{ color: theme.subtextColor }}>
        {t('users.page.pagination.summary', { from, to, total })}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-10 items-center gap-1 rounded-2xl border px-4 text-sm font-bold transition-colors"
          style={buttonStyle(canGoBack)}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('users.page.pagination.previous')}
        </button>

        <span
          className="px-2 text-sm font-bold tabular-nums"
          style={{ color: theme.textColor }}
          aria-current="page"
        >
          {t('users.page.pagination.position', { page, totalPages })}
        </span>

        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-10 items-center gap-1 rounded-2xl border px-4 text-sm font-bold transition-colors"
          style={buttonStyle(canGoForward)}
        >
          {t('users.page.pagination.next')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
