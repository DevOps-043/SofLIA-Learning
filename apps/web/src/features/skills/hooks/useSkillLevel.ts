import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'

export interface SkillLevelInfo {
  level: string | null
  course_count: number
  badge_url: string | null
  next_level_info: {
    level: string
    courses_needed: number
    badge_url: string | null
  } | null
}

export function useSkillLevel(userId: string | null, skillId: string | null) {
  const [levelInfo, setLevelInfo] = useState<SkillLevelInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !skillId) {
      setIsLoading(false)
      return
    }

    const fetchLevel = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/users/${userId}/skills/${skillId}/level`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Error al obtener nivel de skill')
        }

        const data = await response.json()

        if (data.success) {
          setLevelInfo(data)
        } else {
          throw new Error(data.error || 'Error al obtener nivel')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar nivel')
        techDebtLogger.error('Error fetching skill level:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLevel()
  }, [userId, skillId])

  return {
    levelInfo,
    isLoading,
    error
  }
}

