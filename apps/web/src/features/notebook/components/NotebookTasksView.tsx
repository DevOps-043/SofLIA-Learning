'use client'

import { AlertCircle, Check, CircleCheck, ListTodo, Loader2, RotateCcw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useNotebookTasks, type NotebookTaskFilter } from '../hooks/useNotebookTasks'
import type { NotebookDerivedTaskStatus } from '../types'

const FILTERS: NotebookTaskFilter[] = ['all', 'suggested', 'open', 'done', 'dismissed']

export function NotebookTasksView({
  orgSlug,
  status,
  onStatusChange,
}: {
  orgSlug: string
  status: NotebookTaskFilter
  onStatusChange: (status: NotebookTaskFilter) => void
}) {
  const { t } = useTranslation('notebook')
  const taskState = useNotebookTasks({ orgSlug, enabled: true, status })

  return (
    <section className="flex flex-col gap-4" aria-labelledby="notebook-tasks-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="notebook-tasks-title" className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <ListTodo className="h-5 w-5 text-[var(--color-accent)]" />
            {t('tasks.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.03]">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusChange(filter)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === filter
                  ? 'bg-[var(--color-primary)] text-white dark:bg-[var(--color-accent)] dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
              }`}
            >
              {t(`tasks.filter.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {taskState.isLoading ? (
        <div className="flex justify-center py-16 text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : taskState.error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-8 text-center">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <p className="text-sm text-gray-700 dark:text-gray-200">{taskState.error}</p>
          <button type="button" onClick={() => void taskState.reload()} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white dark:bg-[var(--color-accent)] dark:text-gray-900">
            {t('error.retry')}
          </button>
        </div>
      ) : taskState.tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-white/15">
          <ListTodo className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-700 dark:text-gray-200">{t('tasks.emptyTitle')}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('tasks.emptyDescription')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {taskState.tasks.map((task) => (
            <article key={task.taskId} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-medium text-gray-900 dark:text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                  <TaskStatus status={task.status} />
                </div>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {task.courseTitle}{task.lessonTitle ? ` · ${task.lessonTitle}` : ''}{task.noteTitle ? ` · ${task.noteTitle}` : ''}
                </p>
              </div>
              <TaskActions taskId={task.taskId} status={task.status} onStatus={taskState.setTaskStatus} />
            </article>
          ))}
          {taskState.nextCursor && (
            <button type="button" disabled={taskState.isLoadingMore} onClick={() => void taskState.loadMore()} className="mt-2 inline-flex items-center justify-center gap-2 self-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">
              {taskState.isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('tasks.loadMore')}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function TaskStatus({ status }: { status: NotebookDerivedTaskStatus }) {
  const { t } = useTranslation('notebook')
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">{t(`tasks.status.${status}`)}</span>
}

function TaskActions({ taskId, status, onStatus }: { taskId: string; status: NotebookDerivedTaskStatus; onStatus: (taskId: string, status: 'open' | 'done' | 'dismissed') => Promise<boolean> }) {
  const { t } = useTranslation('notebook')
  const buttonClass = 'rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
  return (
    <div className="flex shrink-0 items-center gap-1">
      {status === 'suggested' && <>
        <button type="button" className={buttonClass} onClick={() => void onStatus(taskId, 'open')} title={t('enrichment.taskConfirm')} aria-label={t('enrichment.taskConfirm')}><Check className="h-4 w-4" /></button>
        <button type="button" className={`${buttonClass} text-red-500`} onClick={() => void onStatus(taskId, 'dismissed')} title={t('enrichment.taskDismiss')} aria-label={t('enrichment.taskDismiss')}><X className="h-4 w-4" /></button>
      </>}
      {status === 'open' && <button type="button" className={buttonClass} onClick={() => void onStatus(taskId, 'done')} title={t('enrichment.taskComplete')} aria-label={t('enrichment.taskComplete')}><CircleCheck className="h-4 w-4" /></button>}
      {status === 'done' && <button type="button" className={buttonClass} onClick={() => void onStatus(taskId, 'open')} title={t('enrichment.taskReopen')} aria-label={t('enrichment.taskReopen')}><RotateCcw className="h-4 w-4" /></button>}
    </div>
  )
}
