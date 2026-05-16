'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminWorkshopsPaginationProps {
  page: number
  total: number
  totalPages: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

export function AdminWorkshopsPagination(props: AdminWorkshopsPaginationProps) {
  const { page, total, totalPages, isLoading, onPageChange } = props
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  if (totalPages <= 1) return null

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm sm:flex-row" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.subtextColor }}>
      <span>{t('workshops.pagination.total', { count: total })}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(page - 1, 1))} disabled={page <= 1 || isLoading} className="rounded-xl border px-3 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
          {t('workshops.pagination.previous')}
        </button>
        <span className="min-w-24 text-center font-semibold" style={{ color: theme.textColor }}>{page} / {totalPages}</span>
        <button type="button" onClick={() => onPageChange(Math.min(page + 1, totalPages))} disabled={page >= totalPages || isLoading} className="rounded-xl border px-3 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor, color: theme.onPrimaryColor }}>
          {t('workshops.pagination.next')}
        </button>
      </div>
    </div>
  )
}
