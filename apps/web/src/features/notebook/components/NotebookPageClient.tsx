'use client'

import { useCallback, useState } from 'react'
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
      openNote(noteId)
    },
    [openNote, reload],
  )

  const hasNotes = totalNotes > 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.panelBg, color: theme.textColor }}>
      <OrgNavbar />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToDashboard}
              aria-label={t('backToDashboard')}
              title={t('backToDashboard')}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors hover:opacity-80"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.textColor }}>
                {t('pageTitle')}
              </h1>
              <p className="text-sm" style={{ color: theme.subtextColor }}>
                {t('pageSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewNoteOpen(true)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
          >
            <Plus className="h-4 w-4" />
            {t('newNote.button')}
          </button>
        </header>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: theme.mutedTextColor }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          {/* Mobile tree toggle */}
          <button
            type="button"
            onClick={() => setShowTreeMobile((value) => !value)}
            className="flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-sm font-medium lg:hidden"
            style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
          >
            <PanelLeft className="h-4 w-4" />
            {t('tree.toggle')}
          </button>

          <aside
            className={cn('rounded-xl border lg:block', showTreeMobile ? 'block' : 'hidden')}
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            {isLoading ? (
              <div
                className="flex items-center justify-center py-10"
                style={{ color: theme.mutedTextColor }}
              >
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
              />
            )}
          </aside>

          <main className="min-h-[320px]">
            {isLoading ? (
              <div
                className="flex items-center justify-center py-20"
                style={{ color: theme.mutedTextColor }}
              >
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-12 text-center">
                <AlertCircle className="h-7 w-7 text-red-500" />
                <p className="text-sm" style={{ color: theme.textColor }}>
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
                  style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
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
                    className="mt-2 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
                    style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
                  >
                    <Plus className="h-4 w-4" />
                    {t('newNote.button')}
                  </button>
                }
              />
            ) : visibleNotes.length === 0 ? (
              <NotebookEmptyState
                title={t('empty.filteredTitle')}
                description={t('empty.filteredDescription')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleNotes.map((item) => (
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
            )}
          </main>
        </div>

        <NewNoteModal
          orgSlug={orgSlug}
          isOpen={isNewNoteOpen}
          onClose={() => setIsNewNoteOpen(false)}
          onCreated={handleCreated}
        />
      </div>
    </div>
  )
}
