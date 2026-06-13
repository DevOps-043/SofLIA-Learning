'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { BookOpen, FileText, Loader2, NotebookPen, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  ToolbarDropdown,
  type ToolbarDropdownOption,
} from './editor/ToolbarDropdown'
import {
  createNotebookNote,
  fetchNotebookCourseOptions,
} from '../services/notebook.client.service'
import type { NotebookCourseOption } from '../types'

interface NewNoteModalProps {
  orgSlug: string
  isOpen: boolean
  onClose: () => void
  onCreated: (noteId: string) => void
}

const GRADIENT = 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'

export function NewNoteModal({
  orgSlug,
  isOpen,
  onClose,
  onCreated,
}: NewNoteModalProps) {
  const { t } = useTranslation('notebook')
  const [courses, setCourses] = useState<NotebookCourseOption[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setIsLoadingCourses(true)
    setError(null)
    fetchNotebookCourseOptions(orgSlug)
      .then((data) => {
        if (!cancelled) setCourses(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('newNote.loadError'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCourses(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, orgSlug, t])

  useEffect(() => {
    if (!isOpen) {
      setCourseId('')
      setLessonId('')
      setTitle('')
      setError(null)
    }
  }, [isOpen])

  const lessons = useMemo(
    () => courses.find((course) => course.courseId === courseId)?.lessons ?? [],
    [courses, courseId],
  )

  const courseOptions: ToolbarDropdownOption[] = courses.map((course) => ({
    value: course.courseId,
    label: course.title,
  }))
  const lessonOptions: ToolbarDropdownOption[] = lessons.map((lesson) => ({
    value: lesson.lessonId,
    label: lesson.title,
  }))

  const canSubmit = Boolean(courseId && lessonId) && !isCreating

  const handleCreate = async () => {
    if (!canSubmit) return
    setIsCreating(true)
    setError(null)
    try {
      const note = await createNotebookNote(orgSlug, {
        courseId,
        lessonId,
        title: title.trim() || undefined,
      })
      onCreated(note.noteId)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newNote.createError'))
      setIsCreating(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[var(--color-gray-800)]">
                {/* Header */}
                <div className="flex items-start gap-3 border-b border-gray-100 p-5 dark:border-white/10">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                    style={{ backgroundImage: GRADIENT }}
                  >
                    <NotebookPen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                      {t('newNote.title')}
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {t('newNote.subtitle')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
                    aria-label={t('newNote.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5">
                  {isLoadingCourses ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">{t('newNote.loadingCourses')}</span>
                    </div>
                  ) : courses.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t('newNote.noCourses')}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {t('newNote.courseLabel')}
                        </label>
                        <ToolbarDropdown
                          size="md"
                          icon={BookOpen}
                          ariaLabel={t('newNote.courseLabel')}
                          placeholder={t('newNote.coursePlaceholder')}
                          value={courseId}
                          options={courseOptions}
                          triggerClassName="w-full"
                          onSelect={(value) => {
                            setCourseId(value)
                            setLessonId('')
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {t('newNote.lessonLabel')}
                        </label>
                        <ToolbarDropdown
                          size="md"
                          icon={FileText}
                          ariaLabel={t('newNote.lessonLabel')}
                          placeholder={t('newNote.lessonPlaceholder')}
                          value={lessonId}
                          options={lessonOptions}
                          disabled={!courseId}
                          triggerClassName="w-full"
                          onSelect={setLessonId}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {t('newNote.titleLabel')}
                        </label>
                        <input
                          type="text"
                          value={title}
                          maxLength={256}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder={t('newNote.titlePlaceholder')}
                          className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 p-4 dark:border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    {t('newNote.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundImage: GRADIENT }}
                  >
                    {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('newNote.create')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
