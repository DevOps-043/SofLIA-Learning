'use client'

import { useState, useEffect } from 'react'
import { InstructorCommunitiesService, InstructorCommunity, InstructorCommunityStats } from '../services/instructorCommunities.service'

interface UseInstructorCommunitiesReturn {
  communities: InstructorCommunity[]
  stats: InstructorCommunityStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useInstructorCommunities(): UseInstructorCommunitiesReturn {
  const [communities, setCommunities] = useState<InstructorCommunity[]>([])
  const [stats, setStats] = useState<InstructorCommunityStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [communitiesData, statsData] = await Promise.all([
        InstructorCommunitiesService.getCommunities(),
        InstructorCommunitiesService.getCommunityStats()
      ])

      setCommunities(communitiesData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refetch = () => {
    fetchData()
  }

  return {
    communities,
    stats,
    isLoading,
    error,
    refetch
  }
}

