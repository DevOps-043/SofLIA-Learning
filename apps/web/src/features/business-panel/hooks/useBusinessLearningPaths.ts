import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import {
  BusinessLearningPathsService,
  type BusinessLearningPath,
  type BusinessLearningPathAssignment,
  type BusinessLearningPathDefaultRule,
  type BusinessLearningPathHierarchyNode,
} from '../services/businessLearningPaths.service'

export function useBusinessLearningPaths(orgSlugProp?: string) {
  const params = useParams()
  const orgSlug = orgSlugProp || (params?.orgSlug as string | undefined) || ''

  const [learningPaths, setLearningPaths] = useState<BusinessLearningPath[]>([])
  const [assignments, setAssignments] = useState<BusinessLearningPathAssignment[]>([])
  const [defaultRules, setDefaultRules] = useState<BusinessLearningPathDefaultRule[]>([])
  const [hierarchyNodes, setHierarchyNodes] = useState<BusinessLearningPathHierarchyNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLearningPaths = useCallback(async () => {
    if (!orgSlug) {
      setError('No se pudo determinar la organización')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const data = await BusinessLearningPathsService.getLearningPaths(orgSlug)
      setLearningPaths(data.learningPaths)
      setAssignments(data.assignments)
      setDefaultRules(data.defaultRules)
      setHierarchyNodes(data.hierarchyNodes)
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Error al cargar rutas de aprendizaje',
      )
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    void fetchLearningPaths()
  }, [fetchLearningPaths])

  return {
    learningPaths,
    assignments,
    defaultRules,
    hierarchyNodes,
    isLoading,
    error,
    refetch: fetchLearningPaths,
  }
}
