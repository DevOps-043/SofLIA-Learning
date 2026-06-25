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

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
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
  const theme = useBusinessPanelTheme()
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
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3"
        style={{ backgroundColor: theme.panelBg, color: theme.mutedTextColor }}
      >
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: theme.actionColor }} />
        <p className="text-sm">{t('editor.loading')}</p>
      </div>
    )
  }

  if (loadError || !note) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
        style={{ backgroundColor: theme.panelBg }}
      >
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm" style={{ color: theme.textColor }}>
          {loadError ?? t('editor.notFound')}
        </p>
        <button
          type="button"
          onClick={goBack}
          className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
          style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
        >
          {t('editor.backToNotebook')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.panelBg }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: theme.cardBg + 'cc',
          borderColor: theme.borderColor,
        }}
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:opacity-80"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('editor.back')}
          </button>

          <nav
            className="flex min-w-0 flex-1 items-center gap-1.5 text-sm"
            style={{ color: theme.subtextColor }}
          >
            <BookOpen className="hidden h-4 w-4 shrink-0 sm:block" style={{ color: theme.mutedTextColor }} />
            <span className="hidden max-w-[45%] truncate sm:block" title={note.courseTitle}>
              {note.courseTitle}
            </span>
            <ChevronRight className="hidden h-4 w-4 shrink-0 sm:block" style={{ color: theme.mutedTextColor }} />
            <FileText className="hidden h-4 w-4 shrink-0 sm:block" style={{ color: theme.mutedTextColor }} />
            <span className="truncate" title={note.lessonTitle}>
              {note.lessonTitle}
            </span>
          </nav>

          <div className="shrink-0">
            <SaveStatusBadge status={saveStatus} actionColor={theme.actionColor} />
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
                className="mb-8 w-full border-b border-transparent bg-transparent pb-2 text-3xl font-bold leading-tight outline-none transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
                style={{ color: theme.textColor }}
              />
            }
          />
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-fit">
          <SidePanelCard label={t('editor.locationLabel')} cardBg={theme.cardBg} borderColor={theme.borderColor} textColor={theme.subtextColor}>
            <div className="flex flex-col gap-2 text-sm" style={{ color: theme.subtextColor }}>
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0" style={{ color: theme.mutedTextColor }} />
                <span className="truncate">{note.courseTitle}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" style={{ color: theme.mutedTextColor }} />
                <span className="truncate">{note.lessonTitle}</span>
              </span>
            </div>
          </SidePanelCard>

          <SidePanelCard label={t('editor.actionsLabel')} cardBg={theme.cardBg} borderColor={theme.borderColor} textColor={theme.subtextColor}>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void saveNow()}
                disabled={saveStatus === 'saving'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
              >
                <Save className="h-4 w-4" />
                {t('editor.save')}
              </button>

              {confirmDelete ? (
                <div className="flex flex-col gap-2 rounded-lg bg-red-500/5 p-2">
                  <p className="px-1 text-xs" style={{ color: theme.subtextColor }}>
                    {t('editor.confirmDeletePrompt')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
                      className="rounded-lg px-3 py-2 text-sm font-medium hover:opacity-70"
                      style={{ color: theme.subtextColor }}
                    >
                      {t('editor.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('editor.delete')}
                </button>
              )}
            </div>
          </SidePanelCard>

          <SidePanelCard label={t('editor.tagsLabel')} cardBg={theme.cardBg} borderColor={theme.borderColor} textColor={theme.subtextColor}>
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
  cardBg,
  borderColor,
  textColor,
  children,
}: {
  label: string
  action?: React.ReactNode
  cardBg: string
  borderColor: string
  textColor: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{ backgroundColor: cardBg, borderColor }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: textColor }}>
          {label}
        </p>
        {action}
      </div>
      {children}
    </div>
  )
}

function SaveStatusBadge({
  status,
  actionColor,
}: {
  status: NoteSaveStatus
  actionColor: string
}) {
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
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: actionColor }}>
        <Check className="h-3.5 w-3.5" />
        {t('editor.status.saved')}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
        <CloudOff className="h-3.5 w-3.5" />
        {t('editor.status.error')}
      </span>
    )
  }
  return null
}
