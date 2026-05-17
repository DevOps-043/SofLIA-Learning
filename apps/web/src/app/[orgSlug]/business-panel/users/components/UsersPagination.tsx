'use client'

import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

interface UsersPaginationProps {
  onPageChange: (page: number) => void
  page: number
  total: number
  totalPages: number
}

export function UsersPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: UsersPaginationProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const canGoBack = page > 1
  const canGoForward = page < totalPages

  return (
    <div
      className="flex flex-col items-center justify-between gap-3 rounded-2xl border px-4 py-3 sm:flex-row"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <p className="text-sm" style={{ color: theme.subtextColor }}>
        {t('users.pagination.summary', {
          count: total,
          page,
          totalPages,
          defaultValue: '{{count}} resultados - pagina {{page}} de {{totalPages}}',
        })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          {t('users.pagination.previous', { defaultValue: 'Anterior' })}
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.onPrimaryColor,
          }}
        >
          {t('users.pagination.next', { defaultValue: 'Siguiente' })}
        </button>
      </div>
    </div>
  )
}
