import { useCallback, useEffect } from 'react'
import type { LearningPathStateController } from './useLearningPathState'
import type { Translate } from './types'

interface UseLearningPathDataParams {
  learningPathId: string
  state: LearningPathStateController
  t: Translate
}

export function useLearningPathData({ learningPathId, state, t }: UseLearningPathDataParams) {
  const {
    companies,
    selectedUserId,
    selectedUserOrganizationId,
    setAllCourses,
    setAssignmentOverview,
    setCompanies,
    setError,
    setLearningPath,
    setLoading,
    setSelectedUserId,
  } = state

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

      if (!pathResponse.ok || !pathData.success) throw new Error(pathData.error || t('learningPathsPage.loadError', 'No se pudo cargar la ruta de aprendizaje'))
      if (!coursesResponse.ok || !coursesData.success) throw new Error(coursesData.error || t('learningPathsPage.loadCatalogError', 'No se pudo cargar el catalogo de cursos'))
      if (!companiesResponse.ok || !companiesData.success) throw new Error(companiesData.error || t('learningPathsPage.loadCompaniesError', 'No se pudieron cargar las empresas'))
      if (!assignmentsResponse.ok || !assignmentsData.success) throw new Error(assignmentsData.error || t('learningPathsPage.loadAssignmentsError', 'No se pudieron cargar las asignaciones'))

      setLearningPath(pathData.learningPath)
      setAllCourses(coursesData.courses || [])
      setCompanies(companiesData.companies || [])
      setAssignmentOverview(assignmentsData.assignments || {
        organizationAssignments: [],
        userAssignments: [],
      })
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t('learningPathsPage.loadError', 'No se pudo cargar la ruta de aprendizaje'),
      )
    } finally {
      setLoading(false)
    }
  }, [
    learningPathId,
    setAllCourses,
    setAssignmentOverview,
    setCompanies,
    setError,
    setLearningPath,
    setLoading,
    t,
  ])

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
    if (!memberExists) setSelectedUserId('')
  }, [companies, selectedUserId, selectedUserOrganizationId, setSelectedUserId])

  return loadData
}
