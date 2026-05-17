'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface UserDetailPaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function UserDetailPagination({ page, totalPages, total, limit, onPageChange }: UserDetailPaginationProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const start = ((page - 1) * limit) + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: theme.borderColor }}>
      <p className="text-sm" style={{ color: theme.subtextColor }}>{t('userStats.pagination.showing', { start, end, total })}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="rounded-xl border p-2 disabled:opacity-40" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-medium" style={{ color: theme.textColor }}>{t('userStats.pagination.pageOf', { page, totalPages })}</span>
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-xl border p-2 disabled:opacity-40" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
