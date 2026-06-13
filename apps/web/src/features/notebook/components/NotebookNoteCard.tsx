'use client'

import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Clock, FileText, GraduationCap } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { NotebookItem } from '../types'

interface NotebookNoteCardProps {
  item: NotebookItem
  index: number
  onClick: (item: NotebookItem) => void
}

/**
 * NotebookNoteCard
 *
 * Displays a manual lesson note as a card. Shows the kind badge, title,
 * content preview, source info, and timestamp.
 */
export function NotebookNoteCard({ item, index, onClick }: NotebookNoteCardProps) {
  const { t } = useTranslation('common')

  const formattedDate = formatRelativeDate(item.updatedAt)

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={() => onClick(item)}
      className={cn(
        'group relative rounded-2xl border p-5 cursor-pointer transition-all duration-200',
        'bg-white dark:bg-gray-800/60',
        'border-gray-200 dark:border-white/10',
        'hover:border-teal-300 dark:hover:border-teal-600',
        'hover:shadow-lg hover:shadow-teal-500/5',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Kind badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-700 ring-1 ring-inset ring-teal-500/20 dark:text-teal-300">
          <FileText className="w-3 h-3" />
          {t('notebook.card.manualNote')}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
        {item.title}
      </h3>

      {/* Content preview */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
        {item.contentPreview}
      </p>

      {/* Source info */}
      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="truncate max-w-[140px]">{item.courseTitle}</span>
        </span>

        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formattedDate}
        </span>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.article>
  )
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'Justo ahora'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}
