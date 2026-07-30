'use client'

import { NotebookPen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './NotebookExperience.module.css'

interface NotebookEmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function NotebookEmptyState({
  title,
  description,
  action,
}: NotebookEmptyStateProps) {
  const { t } = useTranslation('notebook')

  return (
    <div className={styles.emptyState}>
      <span className={styles.stateIcon}>
        <NotebookPen className="h-7 w-7" />
      </span>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
      {action}
      <span className="sr-only">{t('empty.aria')}</span>
    </div>
  )
}
