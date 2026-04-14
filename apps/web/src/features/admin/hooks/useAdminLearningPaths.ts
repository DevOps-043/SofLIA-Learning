'use client'

import { useCallback, useEffect, useState } from 'react'

import type { LearningPath } from '../types'

export function useAdminLearningPaths() {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLearningPaths = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/learning-paths')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudieron cargar los learning paths')
      }

      setLearningPaths(data.learningPaths || [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar los learning paths',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLearningPaths()
  }, [loadLearningPaths])

  return {
    learningPaths,
    loading,
    error,
    reload: loadLearningPaths,
  }
}
