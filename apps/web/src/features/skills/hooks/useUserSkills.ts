import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect, useCallback } from 'react'

export interface UserSkill {
  id: string
  skill_id: string
  skill: {
    skill_id: string
    name: string
    slug: string
    description?: string
    category: string
    icon_url?: string
    icon_type?: string
    icon_name?: string
    color?: string
    level?: string
  }
  level: string | null
  course_count: number
  badge_url: string | null
  is_displayed: boolean
  next_level_courses_needed?: number
}

export function useUserSkills(userId: string | null) {
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSkills = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/users/${userId}/skills`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al obtener skills del usuario')
      }

      const data = await response.json()

      if (data.success) {
        setSkills(data.skills || [])
      } else {
        throw new Error(data.error || 'Error al obtener skills')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar skills')
      techDebtLogger.error('Error fetching user skills:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const refreshSkills = useCallback(() => {
    fetchSkills()
  }, [fetchSkills])

  return {
    skills,
    isLoading,
    error,
    refreshSkills
  }
}

