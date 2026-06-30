'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState } from 'react'
import { X, Calendar, Clock, MessageSquare, BookOpen } from 'lucide-react'
import { CourseSelectorModal } from './CourseSelectorModal'
import { HierarchyAssignmentsService } from '@/features/business-panel/services/hierarchy-assignments.service'
import type {
  HierarchyEntityType,
  CreateHierarchyAssignmentRequest,
  HierarchyCourseAssignment,
  UpdateHierarchyAssignmentRequest,
} from '@/features/business-panel/types/hierarchy-assignments.types'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'

interface CourseAssignmentFormProps {
  isOpen: boolean
  onClose: () => void
  entityType: HierarchyEntityType
  entityId: string
  entityName?: string
  assignment?: HierarchyCourseAssignment | null // Si se proporciona, es modo edición
  onSuccess?: () => void
}

export function CourseAssignmentForm({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  assignment,
  onSuccess
}: CourseAssignmentFormProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const primaryColor = panelStyles?.primary_button_color || 'var(--color-primary)'
  const accentColor = panelStyles?.accent_color || primaryColor

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(assignment ? [assignment.course_id] : [])
  const [showCourseSelector, setShowCourseSelector] = useState(false)
  const [startDate, setStartDate] = useState<string>(assignment?.start_date || '')
  const [dueDate, setDueDate] = useState<string>(assignment?.due_date || '')
  const [approach, setApproach] = useState<'fast' | 'balanced' | 'long' | 'custom' | ''>(assignment?.approach || '')
  const [message, setMessage] = useState<string>(assignment?.message || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = !!assignment

  const handleCourseSelect = (courseIds: string[]) => {
    setSelectedCourseIds(courseIds)
    setShowCourseSelector(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isEditMode && selectedCourseIds.length === 0) {
      setError('Debes seleccionar al menos un curso')
      return
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha límite')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode) {
        // Modo edición: actualizar asignación existente
        const updateData: UpdateHierarchyAssignmentRequest = {}
        if (dueDate) updateData.due_date = dueDate
        if (startDate) updateData.start_date = startDate
        if (approach) updateData.approach = approach
        if (message !== undefined) updateData.message = message

        await HierarchyAssignmentsService.updateAssignment(assignment!.id, updateData)
      } else {
        // Modo creación: crear nueva asignación
        const request: CreateHierarchyAssignmentRequest = {
          entity_type: entityType,
          entity_id: entityId,
          course_ids: selectedCourseIds,
          start_date: startDate || null,
          due_date: dueDate || null,
          approach: approach || null,
          message: message || null
        }

        const result = await HierarchyAssignmentsService.createAssignment(request)
        if (!result.success) {
          throw new Error(result.error || 'Error al crear la asignación')
        }
      }

      onSuccess?.()
      handleClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la asignación')
      techDebtLogger.error('Error en asignación:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCourseIds([])
      setStartDate('')
      setDueDate('')
      setApproach('')
      setMessage('')
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-carbon-800 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Editar Asignación' : 'Asignar Cursos'}
            </h2>
            <button 
              onClick={handleClose} 
              disabled={isSubmitting}
              className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                  Cursos a Asignar
                </label>
                <button
                  type="button"
                  onClick={() => setShowCourseSelector(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-gray-400 dark:text-white/40" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedCourseIds.length > 0 
                          ? `${selectedCourseIds.length} curso(s) seleccionado(s)`
                          : 'Seleccionar cursos'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
                        Haz clic para seleccionar los cursos
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Inicio
                  </div>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Fecha Límite
                  </div>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                Enfoque de Aprendizaje
              </label>
              <select
                value={approach}
                onChange={(e) => setApproach(e.target.value as 'fast' | 'balanced' | 'long' | 'custom' | '')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar enfoque (opcional)</option>
                <option value="fast">Rápido</option>
                <option value="balanced">Balanceado</option>
                <option value="long">Extendido</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Mensaje (opcional)
                </div>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Agrega un mensaje para los usuarios sobre esta asignación..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {entityName && (
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Los cursos se asignarán a: <strong>{entityName}</strong>
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || (!isEditMode && selectedCourseIds.length === 0)}
              className="px-6 py-2 rounded-xl text-white font-medium shadow-lg cursor-pointer hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg drop-shadow-md"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
            >
              {isSubmitting 
                ? (isEditMode ? 'Guardando...' : 'Asignando...') 
                : (isEditMode ? 'Guardar Cambios' : 'Asignar Cursos')}
            </button>
          </div>
        </div>
      </div>

      {/* Course Selector Modal */}
      {showCourseSelector && (
        <CourseSelectorModal
          isOpen={showCourseSelector}
          onClose={() => setShowCourseSelector(false)}
          onSelect={handleCourseSelect}
          title="Seleccionar Cursos para Asignar"
        />
      )}
    </>
  )
}
