'use client'

import { motion } from 'framer-motion'
import { Loader2, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { NotebookNoteSource } from '../types'
import { NoteContentView } from './NoteContentView'

interface NoteHoverPreviewProps {
  title: string
  content?: string
  isLoading: boolean
  source?: NotebookNoteSource
}

/**
 * Floating read-only preview shown when hovering a note card. The outer
 * positioned element uses top padding (not margin) so the gap between the card
 * and the preview is still part of the hover area — moving the cursor down into
 * the preview keeps it open instead of dismissing it.
 */
export function NoteHoverPreview({
  title,
  content,
  isLoading,
  source,
}: NoteHoverPreviewProps) {
  const { t } = useTranslation('notebook')

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      role="tooltip"
      className="absolute left-0 right-0 top-full z-30 pt-2"
    >
      <div className="flex max-h-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[var(--color-gray-800)] dark:ring-white/10">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-white/10">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
          <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">
            {title}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
          {isLoading || content === undefined ? (
            <div className="flex items-center gap-2 py-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">{t('preview.loading')}</span>
            </div>
          ) : (
            <NoteContentView
              className="notebook-prose--preview"
              html={content}
              source={source}
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-white/10">
          <Pencil className="h-3 w-3" />
          {t('preview.openHint')}
        </div>
      </div>
    </motion.div>
  )
}
