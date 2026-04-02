'use client'

import useSWR from 'swr'
import type { AdminStatsWithChanges } from '../services/admin-stats.types'

// 🚀 OPTIMIZACIÓN: Implementar SWR para caché automática y revalidación
const fetcher = async (url: string): Promise<AdminStatsWithChanges> => {
  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error al obtener estadísticas: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useAdminStats() {
  const { data: stats, error, isLoading, mutate } = useSWR<AdminStatsWithChanges>(
    '/api/admin/stats',
    fetcher,
    {
      // Configuración optimizada para admin panel
      revalidateOnFocus: false,           // No revalidar al hacer focus en la ventana
      revalidateOnReconnect: true,        // Revalidar al reconectar
      dedupingInterval: 60000,            // Deduplicar requests en 60 segundos
      refreshInterval: 300000,            // Auto-refresh cada 5 minutos
      errorRetryCount: 3,                 // Reintentar 3 veces en caso de error
      errorRetryInterval: 5000,           // Esperar 5s entre reintentos
      shouldRetryOnError: true,           // Reintentar automáticamente
      keepPreviousData: true,             // Mantener datos previos mientras recarga
    }
  )

  return {
    stats: stats ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    mutate // Exponer mutate para invalidación manual si se necesita
  }
}
