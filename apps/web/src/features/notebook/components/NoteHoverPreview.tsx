'use client'

import { motion } from 'framer-motion'
import { Loader2, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { NotebookNoteSource } from '../types'
import { NoteContentView } from './NoteContentView'
import styles from './NotebookExperience.module.css'

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
      className={styles.previewAnchor}
    >
      <div className={styles.previewPopover}>
        <div className={styles.previewHeader}>
          <span className={styles.previewDot} />
          <p className={styles.previewTitle}>{title}</p>
        </div>

        <div className={styles.previewBody}>
          {isLoading || content === undefined ? (
            <div className={styles.previewLoading}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('preview.loading')}</span>
            </div>
          ) : (
            <NoteContentView
              className="notebook-prose--preview"
              html={content}
              source={source}
            />
          )}
        </div>

        <div className={styles.previewFooter}>
          <Pencil className="h-3 w-3" />
          {t('preview.openHint')}
        </div>
      </div>
    </motion.div>
  )
}
