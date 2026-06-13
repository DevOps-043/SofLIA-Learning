'use client'

import { NotebookPen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-primary)] dark:text-[var(--color-accent)]">
        <NotebookPen className="h-7 w-7" />
      </span>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {action}
      <span className="sr-only">{t('empty.aria')}</span>
    </div>
  )
}
