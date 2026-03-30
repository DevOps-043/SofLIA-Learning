'use client'

import { useState, useEffect } from 'react'
import { InstructorWorkshop } from '../services/instructorWorkshops.service'

interface UseInstructorWorkshopsReturn {
  workshops: InstructorWorkshop[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useInstructorWorkshops(): UseInstructorWorkshopsReturn {
  const [workshops, setWorkshops] = useState<InstructorWorkshop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkshops = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/instructor/workshops')

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setWorkshops(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkshops()
  }, [])

  return {
    workshops,
    isLoading,
    error,
    refetch: fetchWorkshops
  }
}

