'use client'

import { useState, useEffect } from 'react'
import { AdminReporte, ReporteStats } from '../services/adminReportes.service'

export function useAdminReportes() {
  const [reportes, setReportes] = useState<AdminReporte[]>([])
  const [stats, setStats] = useState<ReporteStats>({
    total: 0,
    pendientes: 0,
    en_revision: 0,
    en_progreso: 0,
    resueltos: 0,
    rechazados: 0,
    porCategoria: {},
    porPrioridad: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    estado?: string
    categoria?: string
    prioridad?: string
    search?: string
  }>({})

  const fetchReportes = async (customFilters?: typeof filters) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const activeFilters = customFilters || filters
      
      // Construir query string
      const params = new URLSearchParams()
      if (activeFilters.estado) params.append('estado', activeFilters.estado)
      if (activeFilters.categoria) params.append('categoria', activeFilters.categoria)
      if (activeFilters.prioridad) params.append('prioridad', activeFilters.prioridad)
      if (activeFilters.search) params.append('search', activeFilters.search)
      
      const queryString = params.toString()
      const url = `/api/admin/reportes${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      
      if (data.success) {
        setReportes(data.reportes || [])
        setStats(data.stats || {
          total: 0,
          pendientes: 0,
          en_revision: 0,
          en_progreso: 0,
          resueltos: 0,
          rechazados: 0,
          porCategoria: {},
          porPrioridad: {}
        })
      } else {
        setError(data.error || 'Error al cargar reportes')
      }
    } catch (err) {
      setError('Error de conexión al cargar reportes')
    } finally {
      setIsLoading(false)
    }
  }

  const updateReporte = async (
    reporteId: string,
    updates: {
      estado?: AdminReporte['estado']
      admin_asignado?: string
      notas_admin?: string
      prioridad?: AdminReporte['prioridad']
    }
  ) => {
    try {
      
      const response = await fetch('/api/admin/reportes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: reporteId,
          ...updates
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || `Error al actualizar reporte (${response.status})`
        throw new Error(errorMessage)
      }
      
      if (data.success) {
        await fetchReportes() // Recargar la lista
        return { success: true, reporte: data.reporte }
      } else {
        const errorMessage = data.message || data.error || 'Error al actualizar reporte'
        throw new Error(errorMessage)
      }
    } catch (err) {
      throw err
    }
  }

  const refetch = () => {
    fetchReportes()
  }

  const applyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters)
    fetchReportes(newFilters)
  }

  useEffect(() => {
    fetchReportes()
  }, [])

  return {
    reportes,
    stats,
    isLoading,
    error,
    filters,
    refetch,
    updateReporte,
    applyFilters
  }
}

