'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { GenerationStatusBadge } from '@/features/notebook/components/GenerationStatusBadge'
import { useCourseNotebookGeneration } from '@/features/notebook/hooks/useCourseNotebookGeneration'

interface CourseCompletedModalProps {
  isOpen: boolean
  onClose: () => void
  orgSlug?: string | null
  courseId?: string | null
}

export function CourseCompletedModal({
  isOpen,
  onClose,
  orgSlug,
  courseId,
}: CourseCompletedModalProps) {
  const { t } = useTranslation('learn')
  const { t: tn } = useTranslation('notebook')
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const { generation, isLoading, requestCompendium } = useCourseNotebookGeneration({
    orgSlug,
    courseId,
    enabled: isOpen,
  })
  const state = generation?.compendium
  const canViewNotebook = Boolean(orgSlug && (state?.status === 'ready' || state?.status === 'partial'))
  const canRetry = Boolean(
    state?.retryable &&
      (state.status === 'failed' || state.status === 'partial' || state.status === 'stale'),
  )

  const openNotebook = () => {
    if (!orgSlug) return
    const path = state?.noteId
      ? `/${orgSlug}/business-user/notebook/${state.noteId}`
      : `/${orgSlug}/business-user/notebook`
    router.push(path)
  }

  const retry = async () => {
    setIsRetrying(true)
    await requestCompendium()
    setIsRetrying(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-completed-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-gray-900"
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 dark:shadow-accent/25">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 id="course-completed-title" className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
              {t('modals.courseCompleted.title')}
            </h3>
            <p className="mb-4 text-center text-gray-600 dark:text-gray-300">
              {t('modals.courseCompleted.message')}
            </p>

            {orgSlug && courseId && (
              <div className="mb-4 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t('modals.courseCompleted.notebook.title')}
                      </p>
                      {state ? (
                        <GenerationStatusBadge status={state.status} />
                      ) : isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent)]" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                      {state
                        ? tn(`generation.statusDescription.${state.status}`)
                        : t('modals.courseCompleted.notebook.preparing')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canViewNotebook && (
                        <button
                          type="button"
                          onClick={openNotebook}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)]/30 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-accent)]/10 dark:text-[var(--color-accent)]"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {t('modals.courseCompleted.notebook.view')}
                        </button>
                      )}
                      {canRetry && (
                        <button
                          type="button"
                          disabled={isRetrying}
                          onClick={() => void retry()}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                        >
                          {isRetrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          {tn('generation.retry')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 rounded-xl border border-[var(--learn-action)]/20 bg-[var(--learn-action)]/10 p-3">
              <p className="text-center text-sm text-primary dark:text-white">
                {t('modals.courseCompleted.certificateHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl px-6 py-3 font-medium shadow-lg transition-all duration-200 hover:brightness-95"
              style={{ backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
            >
              {t('modals.courseCompleted.continue')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
