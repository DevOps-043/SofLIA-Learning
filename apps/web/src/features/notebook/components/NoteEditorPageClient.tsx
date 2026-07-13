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
} from 'lucide-react'

import dynamic from 'next/dynamic'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import {
  ToastNotification,
  type ToastType,
} from '@/core/components/ToastNotification/ToastNotification'
import { CompendiumActionsPanel } from './CompendiumActionsPanel'
import { NoteContentView } from './NoteContentView'
import { NoteHeaderMenu } from './NoteHeaderMenu'
import { NotebookSofliaPanel } from './NotebookSofliaPanel'
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
    isReadOnly,
    isRegenerating,
    removeNote,
    regenerate,
  } = useNoteEditor(orgSlug, noteId)
  const isCompendium = note?.source === 'course_compendium'

  const [toast, setToast] = useState<{
    isOpen: boolean
    message: string
    type: ToastType
  }>({ isOpen: false, message: '', type: 'success' })

  const goBack = useCallback(() => {
    router.push(`/${orgSlug}/business-user/notebook`)
  }, [orgSlug, router])

  const handleDelete = useCallback(async () => {
    const ok = await removeNote()
    if (ok) goBack()
  }, [removeNote, goBack])

  const handleRegenerate = useCallback(async () => {
    const ok = await regenerate()
    setToast({
      isOpen: true,
      message: ok
        ? t('compendium.regenerateSuccess')
        : t('compendium.regenerateError'),
      type: ok ? 'success' : 'error',
    })
  }, [regenerate, t])

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
            <span
              className="truncate"
              title={isCompendium ? t('compendium.label') : note.lessonTitle}
            >
              {isCompendium ? t('compendium.label') : note.lessonTitle}
            </span>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <SaveStatusBadge status={saveStatus} actionColor={theme.actionColor} />
            {/* El compendio no tiene etiquetas ni se elimina desde aquí; su rail
                conserva Regenerar/Exportar. */}
            {!isCompendium && (
              <NoteHeaderMenu
                tags={tags}
                onTagsChange={setTags}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            )}
          </div>
        </div>
      </header>

      {/* Canvas: document + side panel */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Document sheet — compendiums are read-only (no TipTap mount) */}
        <div className="min-w-0">
          {isReadOnly ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:px-16 lg:px-24">
              <h1
                className="mb-8 border-b border-transparent pb-2 text-3xl font-bold leading-tight"
                style={{ color: theme.textColor }}
              >
                {title}
              </h1>
              <NoteContentView
                className="text-gray-900 dark:text-gray-100"
                html={content}
                source={note.source}
              />
            </div>
          ) : (
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
          )}
        </div>

        {/* Rail derecho: dedicado a SofLIA (análisis + chat). El compendio
            conserva su acción de regenerar. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-fit">
          {isCompendium && (
            <SidePanelCard label={t('editor.actionsLabel')} cardBg={theme.cardBg} borderColor={theme.borderColor} textColor={theme.subtextColor}>
              <CompendiumActionsPanel
                courseId={note.courseId}
                orgSlug={orgSlug}
                isRegenerating={isRegenerating}
                onRegenerate={() => void handleRegenerate()}
                actionColor={theme.actionColor}
                onActionColor={theme.onActionColor}
                subtextColor={theme.subtextColor}
              />
            </SidePanelCard>
          )}

          <NotebookSofliaPanel
            orgSlug={orgSlug}
            noteId={noteId}
            showAnalysis={!isCompendium}
            onApplyEdit={(html) => {
              // Reemplaza el contenido del editor; el autosave persiste y marca
              // el apunte como editado por el usuario.
              setContent(html)
              setToast({
                isOpen: true,
                message: t('soflia.edit.applied'),
                type: 'success',
              })
            }}
            onError={(message) =>
              setToast({ isOpen: true, message, type: 'error' })
            }
          />
        </aside>
      </div>

      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        message={toast.message}
        type={toast.type}
        position="top-right"
      />
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
