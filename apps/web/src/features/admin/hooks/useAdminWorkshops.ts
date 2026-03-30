'use client'

import { useState, useEffect } from 'react'
import { AdminWorkshop, WorkshopStats } from '../services/adminWorkshops.service'

interface UseAdminWorkshopsReturn {
  workshops: AdminWorkshop[]
  stats: WorkshopStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAdminWorkshops(): UseAdminWorkshopsReturn {
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([])
  const [stats, setStats] = useState<WorkshopStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [workshopsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/workshops'),
        fetch('/api/admin/workshops/stats')
      ])

      if (!workshopsResponse.ok || !statsResponse.ok) {
        throw new Error('Error al cargar los datos de talleres')
      }

      const [workshopsData, statsData] = await Promise.all([
        workshopsResponse.json(),
        statsResponse.json()
      ])

      setWorkshops(workshopsData.workshops || [])
      setStats(statsData.stats || null)
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
    workshops,
    stats,
    isLoading,
    error,
    refetch
  }
}
