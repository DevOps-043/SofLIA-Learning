'use client'

import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import type { NotebookSelection } from '../hooks/useNotebookTree'
import type { NotebookTree as NotebookTreeData } from '../types'

interface NotebookTreeProps {
  tree: NotebookTreeData
  selection: NotebookSelection
  onSelect: (selection: NotebookSelection) => void
  expandedCourses: Set<string>
  onToggleCourse: (courseId: string) => void
  /** Opens a note directly (used by the course compendium entry). */
  onOpenNote: (noteId: string) => void
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
}: NotebookTreeProps) {
  const { t } = useTranslation('notebook')

  return (
    <nav className="flex flex-col gap-1 p-2" aria-label={t('tree.aria')}>
      <button
        type="button"
        onClick={() => onSelect({ type: 'all' })}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors',
          selection.type === 'all'
            ? 'bg-[var(--color-accent)]/15 text-[var(--color-primary)] dark:text-[var(--color-accent)]'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5',
        )}
      >
        <Layers className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{t('tree.allNotes')}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
          {tree.totalNotes}
        </span>
      </button>

      {tree.courses.map((course) => {
        const expanded = expandedCourses.has(course.courseId)
        return (
          <div key={course.courseId} className="flex flex-col">
            <div
              className={cn(
                'flex items-center gap-1 rounded-lg pr-2 transition-colors',
                isCourseActive(selection, course.courseId)
                  ? 'bg-[var(--color-accent)]/10'
                  : 'hover:bg-gray-100 dark:hover:bg-white/5',
              )}
            >
              <button
                type="button"
                onClick={() => onToggleCourse(course.courseId)}
                className="flex h-8 w-7 shrink-0 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
                className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-gray-400" />
                <span
                  className={cn(
                    'flex-1 truncate font-medium',
                    isCourseActive(selection, course.courseId)
                      ? 'text-[var(--color-primary)] dark:text-[var(--color-accent)]'
                      : 'text-gray-700 dark:text-gray-200',
                  )}
                >
                  {course.title}
                </span>
                <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
                  {course.totalNotes}
                </span>
              </button>
            </div>

            {expanded && (
              <div className="ml-7 flex flex-col gap-0.5 border-l border-gray-200 pl-2 dark:border-white/10">
                {course.compendium && (
                  <button
                    type="button"
                    onClick={() => onOpenNote(course.compendium!.noteId)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-accent)]/10 dark:text-[var(--color-accent)]"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">
                      {t('compendium.label')}
                    </span>
                  </button>
                )}
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
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      isLessonActive(selection, lesson.lessonId)
                        ? 'bg-[var(--color-accent)]/15 text-[var(--color-primary)] dark:text-[var(--color-accent)]'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="flex-1 truncate">{lesson.title}</span>
                    <span className="shrink-0 text-[11px] text-gray-400">
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
