'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/cn'
import type { NotebookTab } from '../types'

interface NotebookTabsProps {
  activeTab: NotebookTab
  onTabChange: (tab: NotebookTab) => void
}

const TABS: NotebookTab[] = ['all', 'by_course']

/**
 * NotebookTabs
 *
 * Horizontal tab bar to switch between "All notes" and "By course" views.
 */
export function NotebookTabs({ activeTab, onTabChange }: NotebookTabsProps) {
  const { t } = useTranslation('common')

  const tabLabels: Record<NotebookTab, string> = {
    all: t('notebook.tabs.all'),
    by_course: t('notebook.tabs.byCourse'),
  }

  return (
    <div
      className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/60 w-fit mb-6"
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            activeTab === tab
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          {tabLabels[tab]}
        </button>
      ))}
    </div>
  )
}
