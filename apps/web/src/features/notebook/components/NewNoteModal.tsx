'use client'

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import { Dialog, Transition } from '@headlessui/react'
import * as Select from '@radix-ui/react-select'
import {
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  NotebookPen,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import {
  createNotebookNote,
  fetchNotebookCourseOptions,
} from '../services/notebook.client.service'
import type { NotebookCourseOption } from '../types'
import styles from './NotebookExperience.module.css'

interface NewNoteModalProps {
  orgSlug: string
  isOpen: boolean
  onClose: () => void
  onCreated: (noteId: string) => void
}

export function NewNoteModal({
  orgSlug,
  isOpen,
  onClose,
  onCreated,
}: NewNoteModalProps) {
  const { t } = useTranslation('notebook')
  const theme = useBusinessPanelTheme()
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

  const courseOptions: ModalSelectOption[] = courses.map((course) => ({
    value: course.courseId,
    label: course.title,
  }))
  const lessonOptions: ModalSelectOption[] = lessons.map((lesson) => ({
    value: lesson.lessonId,
    label: lesson.title,
  }))

  const canSubmit = Boolean(courseId && lessonId) && !isCreating
  const modalVars = {
    '--notebook-action': theme.actionColor,
    '--notebook-on-action': theme.onActionColor,
    '--notebook-accent': theme.accentColor,
    '--notebook-text': theme.textColor,
    '--notebook-muted': theme.mutedTextColor,
    '--notebook-card': theme.cardBg,
    '--notebook-input': theme.inputBg,
    '--notebook-hover': theme.hoverBg,
    '--notebook-border': theme.borderColor,
  } as CSSProperties

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
      <Dialog
        as="div"
        className={styles.modalRoot}
        style={modalVars}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={styles.modalBackdrop} />
        </Transition.Child>

        <div className={styles.modalViewport}>
          <div className={styles.modalCenter}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={styles.modalPanel}>
                {/* Header */}
                <div className={styles.modalHeader}>
                  <span className={styles.modalIcon}>
                    <NotebookPen className="h-5 w-5" />
                  </span>
                  <div className={styles.modalHeading}>
                    <Dialog.Title className={styles.modalTitle}>
                      {t('newNote.title')}
                    </Dialog.Title>
                    <p className={styles.modalSubtitle}>
                      {t('newNote.subtitle')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className={styles.modalClose}
                    aria-label={t('newNote.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                  {isLoadingCourses ? (
                    <div className={styles.modalLoading}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{t('newNote.loadingCourses')}</span>
                    </div>
                  ) : courses.length === 0 ? (
                    <p className={styles.modalEmpty}>
                      {t('newNote.noCourses')}
                    </p>
                  ) : (
                    <div className={styles.modalForm}>
                      <div className={styles.modalField}>
                        <span className={styles.modalLabel}>
                          {t('newNote.courseLabel')}
                        </span>
                        <ModalSelect
                          icon={BookOpen}
                          ariaLabel={t('newNote.courseLabel')}
                          placeholder={t('newNote.coursePlaceholder')}
                          value={courseId}
                          options={courseOptions}
                          onSelect={(value) => {
                            setCourseId(value)
                            setLessonId('')
                          }}
                        />
                      </div>

                      <div className={styles.modalField}>
                        <span className={styles.modalLabel}>
                          {t('newNote.lessonLabel')}
                        </span>
                        <ModalSelect
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

                      <div className={styles.modalField}>
                        <label htmlFor="new-note-title" className={styles.modalLabel}>
                          {t('newNote.titleLabel')}
                        </label>
                        <input
                          id="new-note-title"
                          type="text"
                          value={title}
                          maxLength={256}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder={t('newNote.titlePlaceholder')}
                          className={styles.modalInput}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className={styles.modalError}>{error}</p>
                  )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={onClose}
                    className={styles.modalCancel}
                  >
                    {t('newNote.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!canSubmit}
                    className={styles.modalSubmit}
                  >
                    {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!isCreating && <Plus className="h-4 w-4" />}
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

interface ModalSelectOption {
  value: string
  label: string
}

function ModalSelect({
  value,
  options,
  onSelect,
  ariaLabel,
  placeholder,
  icon: Icon,
  disabled = false,
}: {
  value: string
  options: ModalSelectOption[]
  onSelect: (value: string) => void
  ariaLabel: string
  placeholder: string
  icon: LucideIcon
  disabled?: boolean
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)

  return (
    <div ref={setPortalContainer} className={styles.modalSelectRoot}>
      <Select.Root
        value={value || undefined}
        onValueChange={onSelect}
        disabled={disabled}
      >
        <Select.Trigger
          aria-label={ariaLabel}
          className={styles.modalSelectTrigger}
        >
          <span className={styles.modalSelectValue}>
            <Icon aria-hidden="true" className={styles.modalSelectIcon} />
            <Select.Value placeholder={placeholder} />
          </span>
          <Select.Icon asChild>
            <ChevronDown aria-hidden="true" className={styles.modalSelectChevron} />
          </Select.Icon>
        </Select.Trigger>

        {portalContainer && (
          <Select.Portal container={portalContainer}>
            <Select.Content
              position="popper"
              sideOffset={8}
              collisionPadding={16}
              className={styles.modalSelectMenu}
            >
              <Select.Viewport className={styles.modalSelectViewport}>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={styles.modalSelectOption}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className={styles.modalSelectIndicator}>
                      <Check aria-hidden="true" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        )}
      </Select.Root>
    </div>
  )
}
