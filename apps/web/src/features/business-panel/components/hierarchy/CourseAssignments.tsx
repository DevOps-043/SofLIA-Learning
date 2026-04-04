'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Calendar, Users, CheckCircle, XCircle, Clock, X, Edit2, Trash2 } from 'lucide-react'
import { HierarchyAssignmentsService } from '@/features/business-panel/services/hierarchy-assignments.service'
import type { HierarchyCourseAssignment, HierarchyEntityType } from '@/features/business-panel/types/hierarchy-assignments.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CourseAssignmentsProps {
  entityType: HierarchyEntityType
  entityId: string
  entityName?: string
  onAssign?: () => void
  onEdit?: (assignment: HierarchyCourseAssignment) => void
  onCancel?: (assignment: HierarchyCourseAssignment) => void
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function CourseAssignments({
  entityType,
  entityId,
  entityName,
  onAssign,
  onEdit,
  onCancel
}: CourseAssignmentsProps) {
  const [assignments, setAssignments] = useState<HierarchyCourseAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAssignments()
  }, [entityType, entityId])

  const loadAssignments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await HierarchyAssignmentsService.getEntityAssignments(entityType, entityId)
      setAssignments(data)
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Error al cargar asignaciones'))
      console.error('Error cargando asignaciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (assignment: HierarchyCourseAssignment) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta asignación?')) {
      return
    }

    try {
      const success = await HierarchyAssignmentsService.cancelAssignment(assignment.id)
      if (success) {
        await loadAssignments()
        onCancel?.(assignment)
      }
    } catch (error: unknown) {
      alert('Error al cancelar la asignación: ' + getErrorMessage(error, 'Error desconocido'))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-blue-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Activa'
    }
  }

  const getCompletionRate = (assignment: HierarchyCourseAssignment) => {
    if (assignment.assigned_users_count === 0) return 0
    return Math.round((assignment.completed_users_count / assignment.assigned_users_count) * 100)
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-white/40">
        Cargando asignaciones...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={loadAssignments}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="p-6 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-gray-400 dark:text-white/20 mb-4" />
        <p className="text-gray-500 dark:text-white/40 mb-4">
          No hay cursos asignados a {entityName || 'esta entidad'}
        </p>
        {onAssign && (
          <button
            onClick={onAssign}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Asignar Cursos
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {onAssign && (
        <div className="flex justify-end">
          <button
            onClick={onAssign}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Asignar Cursos
          </button>
        </div>
      )}

      <div className="space-y-3">
        {assignments.map((assignment) => {
          const stats = HierarchyAssignmentsService.calculateStats(assignment)
          
          return (
            <div
              key={assignment.id}
              className="p-4 rounded-xl border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {assignment.course?.thumbnail_url ? (
                      <img
                        src={assignment.course.thumbnail_url}
                        alt={assignment.course.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400 dark:text-white/40" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {assignment.course?.title || 'Curso sin título'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(assignment.status)}
                        <span className="text-sm text-gray-500 dark:text-white/50">
                          {getStatusLabel(assignment.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {assignment.message && (
                    <p className="text-sm text-gray-600 dark:text-white/60 mt-2 mb-3">
                      {assignment.message}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Total Usuarios</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {assignment.total_users}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Asignados</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {assignment.assigned_users_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Completados</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {assignment.completed_users_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Tasa de Completación</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {getCompletionRate(assignment)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-white/50">
                    {assignment.assigned_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Asignado: {format(new Date(assignment.assigned_at), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    )}
                    {assignment.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Vence: {format(new Date(assignment.due_date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    )}
                  </div>

                  {assignment.assigner && (
                    <div className="mt-3 text-sm text-gray-500 dark:text-white/50">
                      Asignado por: {assignment.assigner.display_name || 
                        (assignment.assigner.first_name && assignment.assigner.last_name
                          ? `${assignment.assigner.first_name} ${assignment.assigner.last_name}`
                          : assignment.assigner.email)}
                    </div>
                  )}
                </div>

                {assignment.status === 'active' && (
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(assignment)}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-white/50 dark:hover:text-blue-400 transition-colors"
                        title="Editar asignación"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onCancel && (
                      <button
                        onClick={() => handleCancel(assignment)}
                        className="p-2 text-gray-500 hover:text-red-500 dark:text-white/50 dark:hover:text-red-400 transition-colors"
                        title="Cancelar asignación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
