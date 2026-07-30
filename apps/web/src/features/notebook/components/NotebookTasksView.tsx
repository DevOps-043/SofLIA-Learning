'use client'

import {
  AlertCircle,
  Check,
  CircleCheck,
  ListTodo,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'
import {
  useNotebookTasks,
  type NotebookTaskFilter,
} from '../hooks/useNotebookTasks'
import type { NotebookDerivedTaskStatus } from '../types'
import styles from './NotebookExperience.module.css'

const FILTERS: NotebookTaskFilter[] = [
  'all',
  'suggested',
  'open',
  'done',
  'dismissed',
]

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
    <section className={styles.taskSection} aria-labelledby="notebook-tasks-title">
      <div className={styles.taskHeader}>
        <div>
          <h2 id="notebook-tasks-title" className={styles.taskTitle}>
            {t('tasks.title')}
          </h2>
          <p className={styles.taskSubtitle}>{t('tasks.subtitle')}</p>
        </div>
        <div className={styles.taskFilters}>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusChange(filter)}
              className={cn(
                styles.taskFilter,
                status === filter && styles.taskFilterActive,
              )}
            >
              {t(`tasks.filter.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {taskState.isLoading ? (
        <div className={styles.loadingState}>
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : taskState.error ? (
        <div className={styles.errorState}>
          <AlertCircle className="h-6 w-6 text-red-500" />
          <p>{taskState.error}</p>
          <button
            type="button"
            onClick={() => void taskState.reload()}
            className={styles.retryButton}
          >
            {t('error.retry')}
          </button>
        </div>
      ) : taskState.tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.stateIcon}>
            <ListTodo className="h-7 w-7" />
          </span>
          <p className={styles.emptyTitle}>{t('tasks.emptyTitle')}</p>
          <p className={styles.emptyDescription}>
            {t('tasks.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className={styles.taskList}>
          {taskState.tasks.map((task) => (
            <article key={task.taskId} className={styles.taskCard}>
              <div className={styles.taskBody}>
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      styles.taskName,
                      task.status === 'done' && styles.taskNameDone,
                    )}
                  >
                    {task.title}
                  </p>
                  <TaskStatus status={task.status} />
                </div>
                <p className={styles.taskMeta}>
                  {task.courseTitle}
                  {task.lessonTitle ? ` · ${task.lessonTitle}` : ''}
                  {task.noteTitle ? ` · ${task.noteTitle}` : ''}
                </p>
              </div>
              <TaskActions
                taskId={task.taskId}
                status={task.status}
                onStatus={taskState.setTaskStatus}
              />
            </article>
          ))}
          {taskState.nextCursor && (
            <button
              type="button"
              disabled={taskState.isLoadingMore}
              onClick={() => void taskState.loadMore()}
              className={styles.loadMore}
            >
              {taskState.isLoadingMore && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
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
  return (
    <span className={styles.taskStatus}>
      {t(`tasks.status.${status}`)}
    </span>
  )
}

function TaskActions({
  taskId,
  status,
  onStatus,
}: {
  taskId: string
  status: NotebookDerivedTaskStatus
  onStatus: (
    taskId: string,
    status: 'open' | 'done' | 'dismissed',
  ) => Promise<boolean>
}) {
  const { t } = useTranslation('notebook')

  return (
    <div className={styles.taskActions}>
      {status === 'suggested' && (
        <>
          <button
            type="button"
            className={styles.taskAction}
            onClick={() => void onStatus(taskId, 'open')}
            title={t('enrichment.taskConfirm')}
            aria-label={t('enrichment.taskConfirm')}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={cn(styles.taskAction, styles.dangerAction)}
            onClick={() => void onStatus(taskId, 'dismissed')}
            title={t('enrichment.taskDismiss')}
            aria-label={t('enrichment.taskDismiss')}
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
      {status === 'open' && (
        <button
          type="button"
          className={styles.taskAction}
          onClick={() => void onStatus(taskId, 'done')}
          title={t('enrichment.taskComplete')}
          aria-label={t('enrichment.taskComplete')}
        >
          <CircleCheck className="h-4 w-4" />
        </button>
      )}
      {status === 'done' && (
        <button
          type="button"
          className={styles.taskAction}
          onClick={() => void onStatus(taskId, 'open')}
          title={t('enrichment.taskReopen')}
          aria-label={t('enrichment.taskReopen')}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
