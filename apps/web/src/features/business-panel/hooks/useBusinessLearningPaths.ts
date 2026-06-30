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

  // Silent background sync — does NOT set isLoading, so the page keeps showing
  // existing content. Use this after mutations (revoke, assign) instead of refetch()
  // to avoid the full-page loading skeleton flash.
  const refetchSilent = useCallback(async () => {
    if (!orgSlug) return
    try {
      const data = await BusinessLearningPathsService.getLearningPaths(orgSlug)
      setLearningPaths(data.learningPaths)
      setAssignments(data.assignments)
      setDefaultRules(data.defaultRules)
      setHierarchyNodes(data.hierarchyNodes)
    } catch {
      // Swallowed — caller already showed an error toast; this is a background sync
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
    refetchSilent,
  }
}
