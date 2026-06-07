'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpenCheck,
  Check,
  Copy,
  FileText,
  GraduationCap,
  Layers,
  Pencil,
  Save,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type {
  NotebookItem,
  NotebookManualNote,
  NotebookModalState,
  NotebookUpdateNoteInput,
} from '../types'
import {
  getNotebookEditableText,
  getNotebookPlainText,
  sanitizeNotebookRichContent,
} from '../services/notebook-content-rendering.service'

interface NotebookNoteModalProps {
  state: NotebookModalState
  errorMessage: string | null
  isDuplicatingSummary: boolean
  isSavingNote: boolean
  onCancelEdit: () => void
  onClose: () => void
  onDuplicateSummary: () => Promise<boolean>
  onEdit: () => void
  onSaveManualNote: (payload: NotebookUpdateNoteInput) => Promise<boolean>
}

export function NotebookNoteModal({
  state,
  errorMessage,
  isDuplicatingSummary,
  isSavingNote,
  onCancelEdit,
  onClose,
  onDuplicateSummary,
  onEdit,
  onSaveManualNote,
}: NotebookNoteModalProps) {
  const { t } = useTranslation('common')
  const [isCopied, setIsCopied] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const copyTextToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim()) return false

    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '0'
      document.body.appendChild(textarea)
      textarea.select()

      try {
        return document.execCommand('copy')
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }, [])

  const handleCopyContent = useCallback(async () => {
    if (!state.item) return

    const textContent =
      state.item.kind === 'manual_note'
        ? getNotebookPlainText(state.item.content)
        : state.item.contentMarkdown || getNotebookPlainText(state.item.contentHtml)

    if (await copyTextToClipboard(textContent)) {
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 2000)
      return
    }

    setIsCopied(false)
  }, [copyTextToClipboard, state.item])

  const modal = (
    <AnimatePresence>
      {state.isOpen && state.item && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0 md:items-center md:p-4">
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative z-[1] flex h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-2xl"
            exit={{ opacity: 0, y: '100%' }}
            initial={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <ModalHeader item={state.item} onClose={onClose} t={t} />

            {state.mode === 'edit' && state.item.kind === 'manual_note' ? (
              <ManualNoteEditForm
                errorMessage={errorMessage}
                isSaving={isSavingNote}
                item={state.item}
                onCancel={onCancelEdit}
                onSave={onSaveManualNote}
                t={t}
              />
            ) : (
              <ModalContent
                errorMessage={errorMessage}
                isCopied={isCopied}
                isDuplicatingSummary={isDuplicatingSummary}
                item={state.item}
                onCopy={handleCopyContent}
                onDuplicateSummary={onDuplicateSummary}
                onEdit={onEdit}
                t={t}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (!isMounted) {
    return null
  }

  return createPortal(modal, document.body)
}

interface ModalHeaderProps {
  item: NotebookItem
  onClose: () => void
  t: (key: string) => string
}

function ModalHeader({ item, onClose, t }: ModalHeaderProps) {
  const isManualNote = item.kind === 'manual_note'

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            isManualNote
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
              : 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
          )}
        >
          {isManualNote ? <FileText className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {isManualNote ? t('notebook.card.manualNote') : t('notebook.card.sofliaSummary')}
        </span>
        <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
          {item.title}
        </h2>
      </div>

      <button
        className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        onClick={onClose}
        type="button"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

interface ModalContentProps {
  item: NotebookItem
  errorMessage: string | null
  isCopied: boolean
  isDuplicatingSummary: boolean
  onCopy: () => void
  onDuplicateSummary: () => Promise<boolean>
  onEdit: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function ModalContent({
  item,
  errorMessage,
  isCopied,
  isDuplicatingSummary,
  onCopy,
  onDuplicateSummary,
  onEdit,
  t,
}: ModalContentProps) {
  const isManualNote = item.kind === 'manual_note'
  const safeContent = useMemo(
    () =>
      sanitizeNotebookRichContent(
        isManualNote ? item.content : item.contentHtml || item.contentMarkdown,
      ),
    [isManualNote, item],
  )

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <NotebookMetadata item={item} t={t} />

      <div className="prose prose-sm mb-6 max-w-none dark:prose-invert">
        <div
          className="text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      </div>

      {isManualNote && item.tags.length > 0 ? <ManualNoteTags tags={item.tags} /> : null}

      {errorMessage ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/5">
        <button className={secondaryButtonClassName} onClick={() => void onCopy()} type="button">
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {isCopied ? t('notebook.modal.copied') : t('notebook.modal.copyButton')}
        </button>

        {isManualNote ? (
          <button className={primaryButtonClassName} onClick={onEdit} type="button">
            <Pencil className="h-4 w-4" />
            {t('notebook.modal.editButton')}
          </button>
        ) : (
          <button
            className={primaryButtonClassName}
            disabled={isDuplicatingSummary || item.status !== 'ready'}
            onClick={() => void onDuplicateSummary()}
            type="button"
          >
            <Pencil className="h-4 w-4" />
            {isDuplicatingSummary
              ? t('notebook.modal.duplicating')
              : t('notebook.modal.duplicateButton')}
          </button>
        )}
      </div>
    </div>
  )
}

function NotebookMetadata({
  item,
  t,
}: {
  item: NotebookItem
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const isManualNote = item.kind === 'manual_note'

  return (
    <div className="mb-5 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <GraduationCap className="h-3.5 w-3.5" />
        {t('notebook.card.course')}: {item.courseTitle}
      </span>

      {isManualNote ? (
        <span className="flex items-center gap-1.5">
          <BookOpenCheck className="h-3.5 w-3.5" />
          {t('notebook.card.lesson')}: {item.lessonTitle}
        </span>
      ) : (
        <>
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            {t('notebook.card.module')}: {item.moduleTitle}
          </span>
          <span className="text-gray-400 dark:text-gray-500">
            {t('notebook.card.version', { version: item.version })}
          </span>
        </>
      )}
    </div>
  )
}

function ManualNoteTags({ tags }: { tags: string[] }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

interface ManualNoteEditFormProps {
  errorMessage: string | null
  isSaving: boolean
  item: NotebookManualNote
  onCancel: () => void
  onSave: (payload: NotebookUpdateNoteInput) => Promise<boolean>
  t: (key: string) => string
}

function ManualNoteEditForm({
  errorMessage,
  isSaving,
  item,
  onCancel,
  onSave,
  t,
}: ManualNoteEditFormProps) {
  const [title, setTitle] = useState(item.title)
  const [content, setContent] = useState(() => getNotebookEditableText(item.content))
  const [tagsText, setTagsText] = useState(item.tags.join(', '))

  useEffect(() => {
    setTitle(item.title)
    setContent(getNotebookEditableText(item.content))
    setTagsText(item.tags.join(', '))
  }, [item])

  const handleSave = async () => {
    await onSave({
      content,
      tags: tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      title,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <NotebookMetadata item={item} t={t} />

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('notebook.modal.titleLabel')}
          </span>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400 dark:border-white/10 dark:bg-gray-800 dark:text-white"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('notebook.modal.contentLabel')}
          </span>
          <textarea
            className="min-h-[260px] w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400 dark:border-white/10 dark:bg-gray-800 dark:text-white"
            onChange={(event) => setContent(event.target.value)}
            value={content}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('notebook.modal.tagsLabel')}
          </span>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400 dark:border-white/10 dark:bg-gray-800 dark:text-white"
            onChange={(event) => setTagsText(event.target.value)}
            value={tagsText}
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/5">
        <button className={secondaryButtonClassName} onClick={onCancel} type="button">
          {t('notebook.modal.cancelButton')}
        </button>
        <button
          className={primaryButtonClassName}
          disabled={isSaving || !content.trim()}
          onClick={() => void handleSave()}
          type="button"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t('notebook.modal.saving') : t('notebook.modal.saveButton')}
        </button>
      </div>
    </div>
  )
}

const primaryButtonClassName =
  'inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50'

const secondaryButtonClassName =
  'inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
