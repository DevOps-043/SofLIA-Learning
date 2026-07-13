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
      // Un solo request agregado en lugar de 4 GETs paralelos: cada request
      // extra pagaba middleware + auth + invocación serverless por separado
      // (ver /api/admin/learning-paths/[id]/bootstrap).
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}/bootstrap`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('learningPathsPage.loadError', 'No se pudo cargar la ruta de aprendizaje'))
      }

      setLearningPath(data.learningPath)
      setAllCourses(data.courses || [])
      setCompanies(data.companies || [])
      setAssignmentOverview(data.assignments || {
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
