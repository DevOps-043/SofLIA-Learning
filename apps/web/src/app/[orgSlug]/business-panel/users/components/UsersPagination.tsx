'use client'

import { useTranslation } from 'react-i18next'

import styles from './UsersPanel.module.css'

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
  const canGoBack = page > 1
  const canGoForward = page < totalPages

  return (
    <nav className={styles.pagination} aria-label={t('users.pagination.label', 'Paginación de usuarios')}>
      <p className={styles.paginationSummary}>
        {t('users.pagination.summary', {
          count: total,
          page,
          totalPages,
          defaultValue: '{{count}} resultados - pagina {{page}} de {{totalPages}}',
        })}
      </p>
      <div className={styles.paginationActions}>
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onPageChange(page - 1)}
          className={styles.paginationButton}
        >
          {t('users.pagination.previous', { defaultValue: 'Anterior' })}
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => onPageChange(page + 1)}
          className={`${styles.paginationButton} ${styles.paginationButtonPrimary}`}
        >
          {t('users.pagination.next', { defaultValue: 'Siguiente' })}
        </button>
      </div>
    </nav>
  )
}
