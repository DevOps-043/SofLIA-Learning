'use client'

import { useState } from 'react'
import type { CourseStudentDetails, EnrolledUser } from '../types'

export function useCourseStudentDetails(
  courseId: string,
  showFeedback: (type: 'success' | 'error', message: string) => void
) {
  const [selectedStudent, setSelectedStudent] = useState<EnrolledUser | null>(null)
  const [studentDetailsData, setStudentDetailsData] = useState<CourseStudentDetails | null>(null)
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false)
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false)

  const loadStudentDetails = async (userId: string) => {
    try {
      setLoadingStudentDetails(true)
      setStudentDetailsData(null)

      if (!courseId || !userId) {
        showFeedback('error', 'Error: Faltan parámetros necesarios')
        return
      }

      const response = await fetch(`/api/admin/courses/${courseId}/student-details/${userId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        showFeedback(
          'error',
          errorData.error || `Error ${response.status}: No se pudieron cargar los detalles`
        )
        setStudentDetailsData(null)
        return
      }

      const data = await response.json()
      if (data.success) {
        setStudentDetailsData(data.data)
      } else {
        showFeedback('error', data.error || 'Error al cargar detalles del estudiante')
        setStudentDetailsData(null)
      }
    } catch {
      showFeedback('error', 'Error de conexión al cargar detalles del estudiante')
      setStudentDetailsData(null)
    } finally {
      setLoadingStudentDetails(false)
    }
  }

  return {
    selectedStudent,
    setSelectedStudent,
    studentDetailsData,
    setStudentDetailsData,
    loadingStudentDetails,
    showStudentDetailsModal,
    setShowStudentDetailsModal,
    loadStudentDetails,
  }
}
