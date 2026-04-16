'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  AdminCompany,
  LearningPath,
  LearningPathAssignmentOverview,
  LearningPathOrganizationAssignmentSummary,
  LearningPathUpsertPayload,
  LearningPathUserAssignmentSummary,
} from '../types'

interface CourseOption {
  id: string
  title: string
}

interface UseLearningPathManagementProps {
  learningPathId: string
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export function useLearningPathManagement({
  learningPathId,
}: UseLearningPathManagementProps) {
  const { t } = useTranslation('admin')
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [allCourses, setAllCourses] = useState<CourseOption[]>([])
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [assignmentOverview, setAssignmentOverview] = useState<LearningPathAssignmentOverview>({
    organizationAssignments: [],
    userAssignments: [],
  })
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [selectedUserOrganizationId, setSelectedUserOrganizationId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null)
  const [organizationAssignmentToRevoke, setOrganizationAssignmentToRevoke] =
    useState<LearningPathOrganizationAssignmentSummary | null>(null)
  const [userAssignmentToRevoke, setUserAssignmentToRevoke] =
    useState<LearningPathUserAssignmentSummary | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [pathResponse, coursesResponse, companiesResponse, assignmentsResponse] =
        await Promise.all([
          fetch(`/api/admin/learning-paths/${learningPathId}`),
          fetch('/api/admin/courses'),
          fetch('/api/admin/companies'),
          fetch(`/api/admin/learning-paths/${learningPathId}/assignments`),
        ])

      const [pathData, coursesData, companiesData, assignmentsData] = await Promise.all([
        pathResponse.json(),
        coursesResponse.json(),
        companiesResponse.json(),
        assignmentsResponse.json(),
      ])

      if (!pathResponse.ok || !pathData.success) {
        throw new Error(
          pathData.error ||
            t('learningPathsPage.loadError', 'No se pudo cargar la ruta de aprendizaje'),
        )
      }

      if (!coursesResponse.ok || !coursesData.success) {
        throw new Error(
          coursesData.error ||
            t('learningPathsPage.loadCatalogError', 'No se pudo cargar el catalogo de cursos'),
        )
      }

      if (!companiesResponse.ok || !companiesData.success) {
        throw new Error(
          companiesData.error ||
            t('learningPathsPage.loadCompaniesError', 'No se pudieron cargar las empresas'),
        )
      }

      if (!assignmentsResponse.ok || !assignmentsData.success) {
        throw new Error(
          assignmentsData.error ||
            t('learningPathsPage.loadAssignmentsError', 'No se pudieron cargar las asignaciones'),
        )
      }

      setLearningPath(pathData.learningPath)
      setAllCourses(coursesData.courses || [])
      setCompanies(companiesData.companies || [])
      setAssignmentOverview(
        assignmentsData.assignments || {
          organizationAssignments: [],
          userAssignments: [],
        },
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t('learningPathsPage.loadError', 'No se pudo cargar la ruta de aprendizaje'),
      )
    } finally {
      setLoading(false)
    }
  }, [learningPathId, t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedUserOrganizationId) {
      setSelectedUserId('')
      return
    }

    const selectedCompany = companies.find((company) => company.id === selectedUserOrganizationId)
    const memberExists = selectedCompany?.members.some((member) => member.user_id === selectedUserId)

    if (!memberExists) {
      setSelectedUserId('')
    }
  }, [companies, selectedUserId, selectedUserOrganizationId])

  const availableCourses = useMemo(() => {
    const usedCourseIds = new Set(learningPath?.items.map((item) => item.course_id) || [])
    return allCourses.filter((course) => !usedCourseIds.has(course.id))
  }, [allCourses, learningPath?.items])

  const activeOrganizationAssignments = useMemo(
    () =>
      assignmentOverview.organizationAssignments.filter(
        (assignment) => assignment.status === 'active',
      ),
    [assignmentOverview.organizationAssignments],
  )

  const activeUserAssignments = useMemo(
    () =>
      assignmentOverview.userAssignments.filter(
        (assignment) => assignment.status === 'assigned',
      ),
    [assignmentOverview.userAssignments],
  )

  const availableOrganizations = useMemo(() => {
    const assignedOrganizationIds = new Set(
      activeOrganizationAssignments.map((assignment) => assignment.organization_id),
    )

    return companies.filter((company) => !assignedOrganizationIds.has(company.id))
  }, [activeOrganizationAssignments, companies])

  const selectedUserOrganizationMembers = useMemo(() => {
    const selectedCompany = companies.find((company) => company.id === selectedUserOrganizationId)
    return selectedCompany?.members || []
  }, [companies, selectedUserOrganizationId])

  async function handleMetadataSave(updates: Partial<LearningPathUpsertPayload>) {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            t('learningPathsPage.updateError', 'No se pudo actualizar la ruta de aprendizaje'),
        )
      }

      setLearningPath(data.learningPath)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('learningPathsPage.updateError', 'No se pudo actualizar la ruta de aprendizaje'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCourse() {
    if (!selectedCourseId) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || t('learningPathsPage.addError', 'No se pudo agregar el curso'),
        )
      }

      setSelectedCourseId('')
      await loadData()
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : t('learningPathsPage.addError', 'No se pudo agregar el curso'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (!learningPath || toIndex < 0 || toIndex >= learningPath.items.length) return

    const reordered = moveItem(learningPath.items, fromIndex, toIndex)
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}/items/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderedItemIds: reordered.map((item) => item.id),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            t('learningPathsPage.reorderError', 'No se pudo reordenar la ruta'),
        )
      }

      setLearningPath(data.learningPath)
    } catch (reorderError) {
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : t('learningPathsPage.reorderError', 'No se pudo reordenar la ruta'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmedRemoveItem() {
    if (!removeTargetId) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/learning-paths/${learningPathId}/items/${removeTargetId}`,
        { method: 'DELETE' },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            t('learningPathsPage.removeError', 'No se pudo eliminar el taller'),
        )
      }

      setRemoveTargetId(null)
      await loadData()
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : t('learningPathsPage.removeError', 'No se pudo eliminar el taller'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignToOrganization() {
    if (!selectedOrganizationId) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/companies/${selectedOrganizationId}/learning-paths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningPathId }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            t(
              'learningPathsPage.assignOrganizationError',
              'No se pudo asignar la ruta a la empresa',
            ),
        )
      }

      setSelectedOrganizationId('')
      await loadData()
    } catch (assignmentError) {
      setError(
        assignmentError instanceof Error
          ? assignmentError.message
          : t(
              'learningPathsPage.assignOrganizationError',
              'No se pudo asignar la ruta a la empresa',
            ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignToUser() {
    if (!selectedUserOrganizationId || !selectedUserId) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/companies/${selectedUserOrganizationId}/user-learning-path-assignments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUserId,
            learningPathId,
          }),
        },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            t('learningPathsPage.assignUserError', 'No se pudo asignar la ruta al usuario'),
        )
      }

      setSelectedUserOrganizationId('')
      setSelectedUserId('')
      await loadData()
    } catch (assignmentError) {
      setError(
        assignmentError instanceof Error
          ? assignmentError.message
          : t('learningPathsPage.assignUserError', 'No se pudo asignar la ruta al usuario'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmRevokeOrganizationAssignment() {
    if (!organizationAssignmentToRevoke) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/companies/${organizationAssignmentToRevoke.organization_id}/learning-paths?assignmentId=${organizationAssignmentToRevoke.id}`,
        { method: 'DELETE' },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            t(
              'learningPathsPage.revokeOrganizationError',
              'No se pudo revocar la asignacion organizacional',
            ),
        )
      }

      setOrganizationAssignmentToRevoke(null)
      await loadData()
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : t(
              'learningPathsPage.revokeOrganizationError',
              'No se pudo revocar la asignacion organizacional',
            ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmRevokeUserAssignment() {
    if (!userAssignmentToRevoke) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/companies/${userAssignmentToRevoke.organization_id}/user-learning-path-assignments?assignmentId=${userAssignmentToRevoke.id}`,
        { method: 'DELETE' },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            t(
              'learningPathsPage.revokeUserError',
              'No se pudo revocar la asignacion individual',
            ),
        )
      }

      setUserAssignmentToRevoke(null)
      await loadData()
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : t(
              'learningPathsPage.revokeUserError',
              'No se pudo revocar la asignacion individual',
            ),
      )
    } finally {
      setSaving(false)
    }
  }

  return {
    learningPath,
    availableCourses,
    availableOrganizations,
    selectedUserOrganizationMembers,
    activeOrganizationAssignments,
    activeUserAssignments,
    selectedCourseId,
    selectedOrganizationId,
    selectedUserOrganizationId,
    selectedUserId,
    loading,
    saving,
    error,
    removeTargetId,
    organizationAssignmentToRevoke,
    userAssignmentToRevoke,
    setLearningPath,
    setSelectedCourseId,
    setSelectedOrganizationId,
    setSelectedUserOrganizationId,
    setSelectedUserId,
    setRemoveTargetId,
    setOrganizationAssignmentToRevoke,
    setUserAssignmentToRevoke,
    handleMetadataSave,
    handleAddCourse,
    handleReorder,
    handleConfirmedRemoveItem,
    handleAssignToOrganization,
    handleAssignToUser,
    handleConfirmRevokeOrganizationAssignment,
    handleConfirmRevokeUserAssignment,
  }
}
