'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CloudOff,
  Loader2,
  NotebookPen,
} from 'lucide-react'

import {
  ToastNotification,
  type ToastType,
} from '@/core/components/ToastNotification/ToastNotification'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useNoteEditor, type NoteSaveStatus } from '../hooks/useNoteEditor'
import { CompendiumActionsPanel } from './CompendiumActionsPanel'
import { NoteContentView } from './NoteContentView'
import { NoteHeaderMenu } from './NoteHeaderMenu'
import { NotebookSofliaPanel } from './NotebookSofliaPanel'
import { NoteTitleField } from './editor/NoteTitleField'
import styles from './NotebookEditor.module.css'

const RichTextEditor = dynamic(
  () => import('./editor/RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className={styles.editorLoading}>
        <Loader2 className="h-6 w-6 animate-spin" />
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
  const editorVars = {
    '--editor-action': theme.actionColor,
    '--editor-on-action': theme.onActionColor,
    '--editor-accent': theme.accentColor,
    '--editor-text': theme.textColor,
    '--editor-subtext': theme.subtextColor,
    '--editor-muted': theme.mutedTextColor,
    '--editor-card': theme.cardBg,
    '--editor-input': theme.inputBg,
    '--editor-panel': theme.panelBg,
    '--editor-hover': theme.hoverBg,
    '--editor-border': theme.borderColor,
    '--editor-divider': theme.dividerColor,
    '--editor-success': theme.successColor,
    '--editor-danger': theme.dangerColor,
  } as CSSProperties

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
      <div className={styles.statePage} style={editorVars}>
        <span className={styles.stateIcon}>
          <Loader2 className="h-6 w-6 animate-spin" />
        </span>
        <p>{t('editor.loading')}</p>
      </div>
    )
  }

  if (loadError || !note) {
    return (
      <div className={styles.statePage} style={editorVars}>
        <span className={styles.stateIconError}>
          <AlertCircle className="h-6 w-6" />
        </span>
        <p>{loadError ?? t('editor.notFound')}</p>
        <button type="button" onClick={goBack} className={styles.stateAction}>
          <ArrowLeft className="h-4 w-4" />
          {t('editor.backToNotebook')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page} style={editorVars}>
      <header className={styles.navShell}>
        <div className={styles.navbar}>
          <button
            type="button"
            onClick={goBack}
            className={styles.backButton}
            aria-label={t('editor.back')}
            title={t('editor.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <span className={styles.navDivider} aria-hidden="true" />

          <nav className={styles.navContext} aria-label={t('editor.locationLabel')}>
            <div className={styles.navContextPath}>
              <span className={styles.navSection}>
                <NotebookPen aria-hidden="true" />
                {t('pageTitle')}
              </span>
              <span className={styles.navContextDot} aria-hidden="true" />
              <span className={styles.navCourse} title={note.courseTitle}>
                {note.courseTitle}
              </span>
            </div>
            <div
              className={styles.navDocumentTitle}
              title={isCompendium ? t('compendium.label') : note.lessonTitle}
            >
              <BookOpen aria-hidden="true" />
              <span>
                {isCompendium ? t('compendium.label') : note.lessonTitle}
              </span>
            </div>
          </nav>

          <div className={styles.navActions}>
            <SaveStatusBadge status={saveStatus} />
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

      <div className={styles.workspace}>
        <main className={styles.documentColumn}>
          {isReadOnly ? (
            <article className={styles.readOnlySheet}>
              <h1 className={styles.readOnlyTitle}>{title}</h1>
              <NoteContentView
                className={styles.readOnlyContent}
                html={content}
                source={note.source}
              />
            </article>
          ) : (
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={t('editor.contentPlaceholder')}
              header={
                <NoteTitleField
                  value={title}
                  onChange={setTitle}
                  placeholder={t('editor.titlePlaceholder')}
                  ariaLabel={t('editor.titlePlaceholder')}
                  className={styles.titleInput}
                />
              }
            />
          )}
        </main>

        <aside className={styles.sideRail}>
          {isCompendium && (
            <SidePanelCard label={t('editor.actionsLabel')}>
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
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={styles.sideCard}>
      <div className={styles.sideCardHeader}>
        <p>{label}</p>
        {action}
      </div>
      {children}
    </section>
  )
}

function SaveStatusBadge({ status }: { status: NoteSaveStatus }) {
  const { t } = useTranslation('notebook')

  if (status === 'saving') {
    return (
      <span className={styles.saveStatus}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('editor.status.saving')}
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className={`${styles.saveStatus} ${styles.saveStatusSuccess}`}>
        <Check className="h-3.5 w-3.5" />
        {t('editor.status.saved')}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className={`${styles.saveStatus} ${styles.saveStatusError}`}>
        <CloudOff className="h-3.5 w-3.5" />
        {t('editor.status.error')}
      </span>
    )
  }
  return null
}
