'use client'

import { useCallback, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowLeft, Loader2, PanelLeft, Plus, Search } from 'lucide-react'

import { cn } from '@/utils/cn'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { OrgNavbar } from '@/core/components/OrgNavbar/OrgNavbar'
import { useNotebookTree } from '../hooks/useNotebookTree'
import { useNotePreviewCache } from '../hooks/useNotePreviewCache'
import { NotebookTree } from './NotebookTree'
import { NotebookNoteCard } from './NotebookNoteCard'
import { NotebookEmptyState } from './NotebookEmptyState'
import { NewNoteModal } from './NewNoteModal'
import { NotebookTasksView } from './NotebookTasksView'
import {
  NotebookViewToolbar,
  type NotebookMainView,
  type NotebookKnowledgeFilter,
  type NotebookLifecycleFilter,
  type NotebookSourceFilter,
} from './NotebookViewToolbar'
import type { NotebookTaskFilter } from '../hooks/useNotebookTasks'
import { requestCourseCompendium } from '../services/notebook.client.service'
import { useNotebookNotesList } from '../hooks/useNotebookNotesList'
import styles from './NotebookExperience.module.css'

interface NotebookPageClientProps {
  orgSlug: string
}

export function NotebookPageClient({ orgSlug }: NotebookPageClientProps) {
  const { t } = useTranslation('notebook')
  const router = useRouter()
  const theme = useBusinessPanelTheme()
  const {
    tree,
    isLoading,
    error,
    reload,
    selection,
    setSelection,
    searchQuery,
    setSearchQuery,
    expandedCourses,
    toggleCourse,
    visibleNotes,
    totalNotes,
  } = useNotebookTree(orgSlug)
  const { previews, loadingId, requestPreview } = useNotePreviewCache(orgSlug)

  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false)
  const [showTreeMobile, setShowTreeMobile] = useState(false)
  const [mainView, setMainView] = useState<NotebookMainView>('timeline')
  const [sourceFilter, setSourceFilter] = useState<NotebookSourceFilter>('all')
  const [knowledgeFilter, setKnowledgeFilter] = useState<NotebookKnowledgeFilter>('all')
  const [lifecycleFilter, setLifecycleFilter] = useState<NotebookLifecycleFilter>('all')
  const [taskFilter, setTaskFilter] = useState<NotebookTaskFilter>('all')
  const [retryingCourseId, setRetryingCourseId] = useState<string | null>(null)
  const noteList = useNotebookNotesList({
    orgSlug,
    enabled: mainView === 'timeline',
    selection,
    query: searchQuery,
    source: sourceFilter,
    knowledgeType: knowledgeFilter,
    lifecycleStatus: lifecycleFilter,
  })

  const openNote = useCallback(
    (noteId: string) => {
      router.push(`/${orgSlug}/business-user/notebook/${noteId}`)
    },
    [orgSlug, router],
  )

  const goToDashboard = useCallback(() => {
    router.push(`/${orgSlug}/business-user/dashboard`)
  }, [orgSlug, router])

  const handleCreated = useCallback(
    (noteId: string) => {
      setIsNewNoteOpen(false)
      void reload()
      void noteList.reload()
      openNote(noteId)
    },
    [noteList, openNote, reload],
  )

  const hasNotes = totalNotes > 0
  const filteredVisibleNotes = sourceFilter === 'all'
    ? visibleNotes
    : visibleNotes.filter((item) => item.note.source === sourceFilter)
  // Fall back to the tree-derived list if the paginated endpoint is not
  // available yet during a rolling deployment.
  const displayedNotes = noteList.error ? filteredVisibleNotes : noteList.notes

  const retryCompendium = useCallback(async (courseId: string) => {
    setRetryingCourseId(courseId)
    try {
      await requestCourseCompendium(orgSlug, courseId)
      await reload()
    } finally {
      setRetryingCourseId(null)
    }
  }, [orgSlug, reload])

  const notebookVars = {
    '--notebook-action': theme.actionColor,
    '--notebook-on-action': theme.onActionColor,
    '--notebook-accent': theme.accentColor,
    '--notebook-text': theme.textColor,
    '--notebook-muted': theme.mutedTextColor,
    '--notebook-inverse-text': theme.inverseTextColor,
    '--notebook-inverse-muted': theme.inverseSubtextColor,
    '--notebook-card': theme.cardBg,
    '--notebook-input': theme.inputBg,
    '--notebook-surface': theme.panelBg,
    '--notebook-hover': theme.hoverBg,
    '--notebook-border': theme.borderColor,
    '--notebook-hero': theme.heroBackground,
    '--notebook-hero-border': theme.heroBorderColor,
  } as CSSProperties

  return (
    <div className={styles.page} style={notebookVars}>
      <OrgNavbar />

      <div className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroIdentity}>
            <button
              type="button"
              onClick={goToDashboard}
              aria-label={t('backToDashboard')}
              title={t('backToDashboard')}
              className={styles.backButton}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>{t('pageTitle')}</h1>
              <p className={styles.heroSubtitle}>{t('pageSubtitle')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewNoteOpen(true)}
            className={styles.heroAction}
          >
            <Plus className="h-4 w-4" />
            {t('newNote.button')}
          </button>
        </section>

        <section className={styles.controlDeck} aria-label={t('pageTitle')}>
          {mainView === 'timeline' && (
            <div className={styles.search}>
              <Search className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('search.placeholder')}
                className={styles.searchInput}
              />
            </div>
          )}

          <NotebookViewToolbar
            view={mainView}
            onViewChange={setMainView}
            source={sourceFilter}
            onSourceChange={setSourceFilter}
            knowledgeType={knowledgeFilter}
            onKnowledgeTypeChange={setKnowledgeFilter}
            lifecycleStatus={lifecycleFilter}
            onLifecycleStatusChange={setLifecycleFilter}
          />
        </section>

        <div className={styles.workspace}>
          {/* Mobile tree toggle */}
          <button
            type="button"
            onClick={() => setShowTreeMobile((value) => !value)}
            className={styles.treeToggle}
            aria-expanded={showTreeMobile}
          >
            <PanelLeft className="h-4 w-4" />
            {t('tree.toggle')}
          </button>

          <aside
            className={cn(
              styles.treePanel,
              showTreeMobile && styles.treePanelVisible,
            )}
          >
            {isLoading ? (
              <div className={styles.loadingState}>
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <NotebookTree
                tree={tree}
                selection={selection}
                onSelect={(next) => {
                  setSelection(next)
                  setShowTreeMobile(false)
                }}
                expandedCourses={expandedCourses}
                onToggleCourse={toggleCourse}
                onOpenNote={(noteId) => {
                  setShowTreeMobile(false)
                  openNote(noteId)
                }}
                onRetryCompendium={(courseId) => void retryCompendium(courseId)}
                retryingCourseId={retryingCourseId}
              />
            )}
          </aside>

          <main className={styles.content}>
            {mainView === 'tasks' ? (
              <NotebookTasksView
                orgSlug={orgSlug}
                status={taskFilter}
                onStatusChange={setTaskFilter}
              />
            ) : isLoading || (noteList.isLoading && noteList.notes.length === 0) ? (
              <div className={styles.loadingState}>
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <AlertCircle className="h-7 w-7 text-red-500" />
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className={styles.retryButton}
                >
                  {t('error.retry')}
                </button>
              </div>
            ) : !hasNotes ? (
              <NotebookEmptyState
                title={t('empty.title')}
                description={t('empty.description')}
                action={
                  <button
                    type="button"
                    onClick={() => setIsNewNoteOpen(true)}
                    className={styles.emptyAction}
                  >
                    <Plus className="h-4 w-4" />
                    {t('newNote.button')}
                  </button>
                }
              />
            ) : displayedNotes.length === 0 ? (
              <NotebookEmptyState
                title={t('empty.filteredTitle')}
                description={t('empty.filteredDescription')}
              />
            ) : (
              <div className={styles.noteList}>
                <div className={styles.noteGrid}>
                  {displayedNotes.map((item) => (
                    <NotebookNoteCard
                      key={item.note.noteId}
                      item={item}
                      preview={previews[item.note.noteId]}
                      isPreviewLoading={loadingId === item.note.noteId}
                      onOpen={openNote}
                      onRequestPreview={requestPreview}
                    />
                  ))}
                </div>
                {noteList.nextCursor && !noteList.error && (
                  <button
                    type="button"
                    disabled={noteList.isLoadingMore}
                    onClick={() => void noteList.loadMore()}
                    className={styles.loadMore}
                  >
                    {noteList.isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('tasks.loadMore')}
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <NewNoteModal
        orgSlug={orgSlug}
        isOpen={isNewNoteOpen}
        onClose={() => setIsNewNoteOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
