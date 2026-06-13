'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CloudOff,
  FileText,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react'

import dynamic from 'next/dynamic'

import { TagInput } from './TagInput'
import { useNoteEditor, type NoteSaveStatus } from '../hooks/useNoteEditor'

/**
 * The rich-text editor pulls in TipTap (a large dependency). Code-split it so
 * the page shell (header, sidebar, title) renders immediately while the editor
 * chunk loads on the client.
 */
const RichTextEditor = dynamic(
  () => import('./editor/RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    ),
  },
)

interface NoteEditorPageClientProps {
  orgSlug: string
  noteId: string
}

export function NoteEditorPageClient({
  orgSlug,
  noteId,
}: NoteEditorPageClientProps) {
  const { t } = useTranslation('notebook')
  const router = useRouter()
  const {
    note,
    title,
    setTitle,
    content,
    setContent,
    tags,
    setTags,
    isLoading,
    loadError,
    saveStatus,
    isDeleting,
    saveNow,
    removeNote,
  } = useNoteEditor(orgSlug, noteId)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const goBack = useCallback(() => {
    router.push(`/${orgSlug}/business-user/notebook`)
  }, [orgSlug, router])

  const handleDelete = useCallback(async () => {
    const ok = await removeNote()
    if (ok) goBack()
  }, [removeNote, goBack])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent)]" />
        <p className="text-sm">{t('editor.loading')}</p>
      </div>
    )
  }

  if (loadError || !note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="h-8 w-8 text-[var(--color-error)]" />
        <p className="text-sm text-gray-700 dark:text-gray-200">
          {loadError ?? t('editor.notFound')}
        </p>
        <button
          type="button"
          onClick={goBack}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {t('editor.backToNotebook')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('editor.back')}
          </button>

          <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <BookOpen className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />
            <span
              className="hidden max-w-[45%] truncate sm:block"
              title={note.courseTitle}
            >
              {note.courseTitle}
            </span>
            <ChevronRight className="hidden h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600 sm:block" />
            <FileText className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />
            <span className="truncate" title={note.lessonTitle}>
              {note.lessonTitle}
            </span>
          </nav>

          <div className="shrink-0">
            <SaveStatusBadge status={saveStatus} />
          </div>
        </div>
      </header>

      {/* Canvas: document + side panel */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Document sheet */}
        <div className="min-w-0">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder={t('editor.contentPlaceholder')}
            pageClassName="px-6 py-12 sm:px-16 lg:px-24"
            header={
              <input
                type="text"
                value={title}
                maxLength={256}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('editor.titlePlaceholder')}
                className="mb-8 w-full border-b border-transparent bg-transparent pb-2 text-3xl font-bold leading-tight text-gray-900 outline-none transition-colors placeholder:text-gray-300 focus:border-gray-200 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-white/10"
              />
            }
          />
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-fit">
          <SidePanelCard label={t('editor.locationLabel')}>
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{note.courseTitle}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{note.lessonTitle}</span>
              </span>
            </div>
          </SidePanelCard>

          <SidePanelCard label={t('editor.actionsLabel')}>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void saveNow()}
                disabled={saveStatus === 'saving'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {t('editor.save')}
              </button>

              {confirmDelete ? (
                <div className="flex flex-col gap-2 rounded-lg bg-[var(--color-error)]/5 p-2">
                  <p className="px-1 text-xs text-gray-600 dark:text-gray-300">
                    {t('editor.confirmDeletePrompt')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-error)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {t('editor.confirmDelete')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                    >
                      {t('editor.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-error)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('editor.delete')}
                </button>
              )}
            </div>
          </SidePanelCard>

          <SidePanelCard label={t('editor.tagsLabel')}>
            <TagInput tags={tags} onChange={setTags} />
          </SidePanelCard>
        </aside>
      </div>
    </div>
  )
}

function SidePanelCard({
  label,
  action,
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        {action}
      </div>
      {children}
    </div>
  )
}

function SaveStatusBadge({ status }: { status: NoteSaveStatus }) {
  const { t } = useTranslation('notebook')

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('editor.status.saving')}
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-success)]">
        <Check className="h-3.5 w-3.5" />
        {t('editor.status.saved')}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-error)]">
        <CloudOff className="h-3.5 w-3.5" />
        {t('editor.status.error')}
      </span>
    )
  }
  return null
}
