'use client'

import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import type { NotebookSelection } from '../hooks/useNotebookTree'
import type { NotebookTree as NotebookTreeData } from '../types'
import { GenerationStatusBadge } from './GenerationStatusBadge'
import styles from './NotebookExperience.module.css'

interface NotebookTreeProps {
  tree: NotebookTreeData
  selection: NotebookSelection
  onSelect: (selection: NotebookSelection) => void
  expandedCourses: Set<string>
  onToggleCourse: (courseId: string) => void
  /** Opens a note directly (used by the course compendium entry). */
  onOpenNote: (noteId: string) => void
  onRetryCompendium: (courseId: string) => void
  retryingCourseId?: string | null
}

function isLessonActive(
  selection: NotebookSelection,
  lessonId: string,
): boolean {
  return selection.type === 'lesson' && selection.lessonId === lessonId
}

function isCourseActive(
  selection: NotebookSelection,
  courseId: string,
): boolean {
  return selection.type === 'course' && selection.courseId === courseId
}

export function NotebookTree({
  tree,
  selection,
  onSelect,
  expandedCourses,
  onToggleCourse,
  onOpenNote,
  onRetryCompendium,
  retryingCourseId,
}: NotebookTreeProps) {
  const { t } = useTranslation('notebook')

  return (
    <nav className={styles.treeNav} aria-label={t('tree.aria')}>
      <button
        type="button"
        onClick={() => onSelect({ type: 'all' })}
        className={cn(
          styles.treeAll,
          selection.type === 'all' && styles.treeActive,
        )}
      >
        <Layers className="h-4 w-4 shrink-0" />
        <span className={styles.treeLabel}>{t('tree.allNotes')}</span>
        <span className={styles.treeCount}>
          {tree.totalNotes}
        </span>
      </button>

      {tree.courses.map((course) => {
        const expanded = expandedCourses.has(course.courseId)
        return (
          <div key={course.courseId} className={styles.treeCourse}>
            <div
              className={cn(
                styles.courseRow,
                isCourseActive(selection, course.courseId) && styles.treeActive,
              )}
            >
              <button
                type="button"
                onClick={() => onToggleCourse(course.courseId)}
                className={styles.treeExpander}
                aria-label={expanded ? t('tree.collapse') : t('tree.expand')}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  onSelect({ type: 'course', courseId: course.courseId })
                }
                className={styles.courseButton}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className={styles.treeLabel}>
                  {course.title}
                </span>
                <span className={styles.treeCount}>
                  {course.totalNotes}
                </span>
              </button>
            </div>

            {expanded && (
              <div className={styles.treeBranch}>
                {(course.compendium || course.generationState) && (() => {
                  const state = course.compendium?.generationState ?? course.generationState
                  const isRetrying = retryingCourseId === course.courseId
                  return (
                    <div className={styles.compendiumRow}>
                      <button
                        type="button"
                        disabled={!course.compendium}
                        onClick={() => course.compendium && onOpenNote(course.compendium.noteId)}
                        className={styles.treeCompendium}
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span className={styles.treeLabel}>{t('compendium.label')}</span>
                        {state && <GenerationStatusBadge status={state.status} compact />}
                      </button>
                      {state?.retryable && (state.status === 'failed' || state.status === 'partial' || state.status === 'stale') && (
                        <button
                          type="button"
                          disabled={isRetrying}
                          onClick={() => onRetryCompendium(course.courseId)}
                          className={styles.retryIcon}
                          title={t('generation.retry')}
                          aria-label={t('generation.retry')}
                        >
                          {isRetrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  )
                })()}
                {course.lessons.map((lesson) => (
                  <button
                    key={lesson.lessonId}
                    type="button"
                    onClick={() =>
                      onSelect({
                        type: 'lesson',
                        courseId: course.courseId,
                        lessonId: lesson.lessonId,
                      })
                    }
                    className={cn(
                      styles.treeLesson,
                      isLessonActive(selection, lesson.lessonId) && styles.treeActive,
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className={styles.treeLabel}>{lesson.title}</span>
                    <span className={styles.treeCount}>
                      {lesson.notes.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
