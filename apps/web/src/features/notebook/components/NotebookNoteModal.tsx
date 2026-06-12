'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpenCheck,
  Check,
  Copy,
  FileText,
  GraduationCap,
  Pencil,
  Save,
  X,
} from 'lucide-react'
import type {
  NotebookManualNote,
  NotebookModalState,
  NotebookUpdateNoteInput,
} from '../types'
import {
  getNotebookPlainText,
  sanitizeNotebookRichContent,
} from '../services/notebook-content-rendering.service'

interface NotebookNoteModalProps {
  state: NotebookModalState
  errorMessage: string | null
  isSavingNote: boolean
  onCancelEdit: () => void
  onClose: () => void
  onEdit: () => void
  onSaveManualNote: (payload: NotebookUpdateNoteInput) => Promise<boolean>
}

export function NotebookNoteModal({
  state,
  errorMessage,
  isSavingNote,
  onCancelEdit,
  onClose,
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

    if (await copyTextToClipboard(getNotebookPlainText(state.item.content))) {
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

            {state.mode === 'edit' ? (
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
                item={state.item}
                onCopy={handleCopyContent}
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
  item: NotebookManualNote
  onClose: () => void
  t: (key: string) => string
}

function ModalHeader({ item, onClose, t }: ModalHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <FileText className="h-3 w-3" />
          {t('notebook.card.manualNote')}
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
  item: NotebookManualNote
  errorMessage: string | null
  isCopied: boolean
  onCopy: () => void
  onEdit: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function ModalContent({
  item,
  errorMessage,
  isCopied,
  onCopy,
  onEdit,
  t,
}: ModalContentProps) {
  const safeContent = useMemo(
    () => sanitizeNotebookRichContent(item.content),
    [item],
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

      {item.tags.length > 0 ? <ManualNoteTags tags={item.tags} /> : null}

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

        <button className={primaryButtonClassName} onClick={onEdit} type="button">
          <Pencil className="h-4 w-4" />
          {t('notebook.modal.editButton')}
        </button>
      </div>
    </div>
  )
}

function NotebookMetadata({
  item,
  t,
}: {
  item: NotebookManualNote
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <GraduationCap className="h-3.5 w-3.5" />
        {t('notebook.card.course')}: {item.courseTitle}
      </span>

      <span className="flex items-center gap-1.5">
        <BookOpenCheck className="h-3.5 w-3.5" />
        {t('notebook.card.lesson')}: {item.lessonTitle}
      </span>
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
  const [content, setContent] = useState(item.content)
  const [tagsText, setTagsText] = useState(item.tags.join(', '))
  const editorRef = useRef<HTMLDivElement>(null)

  // Initialize and sync the contentEditable div with the note HTML content.
  useEffect(() => {
    setTitle(item.title)
    setContent(item.content)
    setTagsText(item.tags.join(', '))
  }, [item])

  // Sync contentEditable innerHTML when content state changes from outside
  // (e.g. when the item changes). Avoid overwriting while the user is typing.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = sanitizeNotebookRichContent(content)
    }
  }, [content])

  const handleContentInput = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }, [])

  const hasContent = useMemo(() => {
    if (!content) return false
    // Strip HTML tags and check if there's actual text
    const textOnly = content.replace(/<[^>]*>/g, '').trim()
    return textOnly.length > 0
  }, [content])

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

        <div className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('notebook.modal.contentLabel')}
          </span>
          <div
            ref={editorRef}
            className="prose prose-sm min-h-[260px] max-w-none w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-teal-400 dark:prose-invert dark:border-white/10 dark:bg-gray-800 dark:text-white overflow-y-auto"
            contentEditable
            onInput={handleContentInput}
            style={{ lineHeight: '1.7' }}
            suppressContentEditableWarning
          />
        </div>

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
          disabled={isSaving || !hasContent}
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
