'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  X,
} from 'lucide-react'
import { CourseSelectorModal } from './CourseSelectorModal'
import { HierarchyAssignmentsService } from '@/features/business-panel/services/hierarchy-assignments.service'
import type {
  HierarchyEntityType,
  CreateHierarchyAssignmentRequest,
  HierarchyCourseAssignment,
  UpdateHierarchyAssignmentRequest,
} from '@/features/business-panel/types/hierarchy-assignments.types'
import { useHierarchyDialog } from './useHierarchyDialog'
import styles from './HierarchyExperience.module.css'

interface CourseAssignmentFormProps {
  isOpen: boolean
  onClose: () => void
  entityType: HierarchyEntityType
  entityId: string
  entityName?: string
  assignment?: HierarchyCourseAssignment | null
  onSuccess?: () => void
}

type LearningApproach = 'fast' | 'balanced' | 'long' | 'custom' | ''

const APPROACHES: Array<{ value: Exclude<LearningApproach, ''>; label: string; detail: string }> = [
  { value: 'fast', label: 'Rápido', detail: 'Prioriza lo esencial' },
  { value: 'balanced', label: 'Balanceado', detail: 'Ritmo recomendado' },
  { value: 'long', label: 'Extendido', detail: 'Mayor profundidad' },
  { value: 'custom', label: 'Personalizado', detail: 'Sin ritmo sugerido' },
]

export function CourseAssignmentForm({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  assignment,
  onSuccess,
}: CourseAssignmentFormProps) {
  const isEditMode = Boolean(assignment)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [showCourseSelector, setShowCourseSelector] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [approach, setApproach] = useState<LearningApproach>('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSelectedCourseIds(assignment ? [assignment.course_id] : [])
    setStartDate(assignment?.start_date || '')
    setDueDate(assignment?.due_date || '')
    setApproach(assignment?.approach || '')
    setMessage(assignment?.message || '')
    setError(null)
  }, [assignment, isOpen])

  const handleClose = () => {
    if (!isSubmitting) onClose()
  }
  const dialogRef = useHierarchyDialog({
    isOpen: isOpen && !showCourseSelector,
    onClose: handleClose,
    preventClose: isSubmitting,
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!isEditMode && selectedCourseIds.length === 0) {
      setError('Selecciona al menos un curso para continuar.')
      return
    }
    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      setError('La fecha de inicio debe ser anterior a la fecha límite.')
      return
    }

    setIsSubmitting(true)
    try {
      if (assignment) {
        const updateData: UpdateHierarchyAssignmentRequest = {
          start_date: startDate || null,
          due_date: dueDate || null,
          approach: approach || null,
          message: message || null,
        }
        await HierarchyAssignmentsService.updateAssignment(assignment.id, updateData)
      } else {
        const request: CreateHierarchyAssignmentRequest = {
          entity_type: entityType,
          entity_id: entityId,
          course_ids: selectedCourseIds,
          start_date: startDate || null,
          due_date: dueDate || null,
          approach: approach || null,
          message: message || null,
        }
        const result = await HierarchyAssignmentsService.createAssignment(request)
        if (!result.success) {
          throw new Error(result.error || 'No fue posible crear la asignación.')
        }
      }

      onSuccess?.()
      onClose()
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'No fue posible guardar la asignación.')
      techDebtLogger.error('Error en asignación:', caughtError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className={styles.overlay}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) handleClose()
        }}
      >
        <div
          ref={dialogRef}
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-assignment-title"
          aria-hidden={showCourseSelector || undefined}
        >
          <header className={styles.dialogHeader}>
            <span className={styles.dialogIcon}><BookOpen aria-hidden="true" /></span>
            <div className={styles.dialogHeading}>
              <p className={styles.dialogKicker}>Plan de aprendizaje</p>
              <h2 id="course-assignment-title" className={styles.dialogTitle}>
                {isEditMode ? 'Editar asignación' : 'Asignar cursos'}
              </h2>
              <p className={styles.dialogDescription}>
                Define contenido, ritmo y fechas sin perder el contexto de la unidad.
              </p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Cerrar"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <form id="course-assignment-form" className={styles.dialogBody} onSubmit={handleSubmit}>
            <div className={styles.formStack}>
              {error ? (
                <p className={styles.formError} role="alert">
                  <AlertCircle aria-hidden="true" />
                  {error}
                </p>
              ) : null}

              {!isEditMode ? (
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Cursos a asignar</span>
                  <button
                    type="button"
                    className={styles.coursePicker}
                    onClick={() => setShowCourseSelector(true)}
                  >
                    <span className={styles.coursePickerIcon}><BookOpen aria-hidden="true" /></span>
                    <span className={styles.coursePickerCopy}>
                      <strong>
                        {selectedCourseIds.length
                          ? `${selectedCourseIds.length} ${selectedCourseIds.length === 1 ? 'curso seleccionado' : 'cursos seleccionados'}`
                          : 'Seleccionar cursos'}
                      </strong>
                      <span>Explora el catálogo disponible para esta organización.</span>
                    </span>
                    <span className={styles.coursePickerCount} aria-hidden="true">
                      {selectedCourseIds.length || '+'}
                    </span>
                  </button>
                </div>
              ) : null}

              <div className={styles.formGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}><CalendarDays aria-hidden="true" /> Fecha de inicio</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className={styles.input}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}><Clock3 aria-hidden="true" /> Fecha límite</span>
                  <input
                    type="date"
                    value={dueDate}
                    min={startDate || undefined}
                    onChange={(event) => setDueDate(event.target.value)}
                    className={styles.input}
                  />
                </label>
              </div>

              <fieldset className={styles.approachFieldset}>
                <legend className={styles.fieldLabel}>Enfoque de aprendizaje</legend>
                <div className={styles.approachGrid}>
                  {APPROACHES.map((option) => (
                    <label
                      key={option.value}
                      className={styles.approachOption}
                      data-selected={approach === option.value}
                    >
                      <input
                        type="radio"
                        name="learning-approach"
                        value={option.value}
                        checked={approach === option.value}
                        onChange={() => setApproach(option.value)}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                      <CheckCircle2 aria-hidden="true" />
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}><MessageSquareText aria-hidden="true" /> Mensaje opcional</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  placeholder="Añade contexto útil para las personas que recibirán esta asignación."
                  className={`${styles.input} ${styles.textarea}`}
                />
              </label>

              {entityName ? (
                <div className={styles.infoBanner}>
                  <CheckCircle2 aria-hidden="true" />
                  <span>Esta asignación se aplicará a <strong>{entityName}</strong>.</span>
                </div>
              ) : null}
            </div>
          </form>

          <footer className={styles.dialogFooter}>
            <button type="button" className={styles.secondaryButton} onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="submit"
              form="course-assignment-form"
              className={styles.primaryButton}
              disabled={isSubmitting || (!isEditMode && selectedCourseIds.length === 0)}
            >
              {isSubmitting ? 'Guardando…' : isEditMode ? 'Guardar cambios' : 'Asignar cursos'}
            </button>
          </footer>
        </div>
      </div>

      {showCourseSelector ? (
        <CourseSelectorModal
          isOpen
          initialSelectedIds={selectedCourseIds}
          onClose={() => setShowCourseSelector(false)}
          onSelect={(courseIds) => {
            setSelectedCourseIds(courseIds)
            setShowCourseSelector(false)
          }}
          title="Seleccionar cursos"
        />
      ) : null}
    </>
  )
}
