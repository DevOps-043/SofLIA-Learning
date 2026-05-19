'use client'

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  FileText,
  Sparkles,
  X,
  GraduationCap,
  BookOpenCheck,
  Layers,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { NotebookItem, NotebookModalState } from '../types'

interface NotebookNoteModalProps {
  state: NotebookModalState
  onClose: () => void
}

/**
 * NotebookNoteModal
 *
 * Full-screen modal (slide-up) for reading a notebook item.
 * Manual notes show their content in read-only mode.
 * SofLIA summaries show rendered HTML content.
 *
 * V1: Read-only view. Edit redirects to the learn page.
 */
export function NotebookNoteModal({ state, onClose }: NotebookNoteModalProps) {
  const { t } = useTranslation('common')
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyContent = useCallback(async () => {
    if (!state.item) return

    const textContent =
      state.item.kind === 'manual_note'
        ? state.item.content
        : state.item.contentMarkdown || state.item.contentHtml

    try {
      await navigator.clipboard.writeText(textContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Clipboard API not available in some contexts
    }
  }, [state.item])

  return (
    <AnimatePresence>
      {state.isOpen && state.item && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-12 md:inset-4 md:top-auto md:bottom-auto md:mx-auto md:my-auto md:max-w-2xl md:max-h-[85vh] z-50 flex flex-col rounded-t-3xl md:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            <ModalHeader item={state.item} onClose={onClose} t={t} />

            <ModalContent
              item={state.item}
              isCopied={isCopied}
              onCopy={handleCopyContent}
              t={t}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ModalHeaderProps {
  item: NotebookItem
  onClose: () => void
  t: (key: string) => string
}

function ModalHeader({ item, onClose, t }: ModalHeaderProps) {
  const isManualNote = item.kind === 'manual_note'

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
            isManualNote
              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
          )}
        >
          {isManualNote ? (
            <FileText className="w-3 h-3" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {isManualNote
            ? t('notebook.card.manualNote')
            : t('notebook.card.sofliaSummary')}
        </span>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {item.title}
        </h2>
      </div>

      <button
        onClick={onClose}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

interface ModalContentProps {
  item: NotebookItem
  isCopied: boolean
  onCopy: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function ModalContent({ item, isCopied, onCopy, t }: ModalContentProps) {
  const isManualNote = item.kind === 'manual_note'

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      {/* Source metadata */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          {t('notebook.card.course')}: {item.courseTitle}
        </span>

        {isManualNote && (
          <span className="flex items-center gap-1.5">
            <BookOpenCheck className="w-3.5 h-3.5" />
            {t('notebook.card.lesson')}: {item.lessonTitle}
          </span>
        )}

        {!isManualNote && (
          <>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {t('notebook.card.module')}: {item.moduleTitle}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              {t('notebook.card.version', { version: item.version })}
            </span>
          </>
        )}
      </div>

      {/* Content body */}
      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
        {isManualNote ? (
          <div
            className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            {item.content}
          </div>
        ) : (
          <div
            className="text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: item.contentHtml || item.contentMarkdown,
            }}
          />
        )}
      </div>

      {/* Tags (manual notes) */}
      {isManualNote && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
        <button
          onClick={onCopy}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            isCopied
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
          )}
        >
          <Copy className="w-4 h-4" />
          {isCopied ? '✓' : t('notebook.modal.duplicateButton').split(' ')[0]}
        </button>
      </div>
    </div>
  )
}
