import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Hook para obtener analíticas de jerarquía con actualización en tiempo real
 * 
 * Usa SWR para polling automático cada 30 segundos, manteniendo las métricas
 * actualizadas sin necesidad de recargar la página manualmente.
 */

import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { HierarchyService } from '../services/hierarchy.service'
import { HierarchyAnalytics } from '../types/hierarchy.types'

type EntityType = 'region' | 'zone' | 'team'

interface UseHierarchyAnalyticsOptions {
  /**
   * Intervalo de polling en milisegundos (default: 30000 = 30 segundos)
   */
  refreshInterval?: number
  /**
   * Si está deshabilitado, no hará polling (default: false)
   */
  disabled?: boolean
}

/**
 * Hook para obtener analíticas de una entidad jerárquica con actualización automática
 * 
 * @param entityType - Tipo de entidad ('region' | 'zone' | 'team')
 * @param entityId - ID de la entidad
 * @param options - Opciones de configuración del hook
 * @returns Objeto con analytics, loading, error y función de revalidación manual
 * 
 * @example
 * ```tsx
 * const { analytics, isLoading, error, mutate } = useHierarchyAnalytics('team', teamId)
 * 
 * // Revalidar manualmente si es necesario
 * mutate()
 * ```
 */
export function useHierarchyAnalytics(
  entityType: EntityType,
  entityId: string | null | undefined,
  options: UseHierarchyAnalyticsOptions = {}
) {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const {
    refreshInterval = 30000, // 30 segundos por defecto
    disabled = false
  } = options

  const key = entityId && !disabled && orgSlug
    ? `hierarchy-analytics-${orgSlug}-${entityType}-${entityId}`
    : null

  const { data, error, isLoading, mutate } = useSWR<HierarchyAnalytics | null>(
    key,
    async () => {
      if (!entityId || !orgSlug) return null
      return await HierarchyService.getVisualAnalytics(entityType, entityId, orgSlug)
    },
    {
      refreshInterval: disabled ? 0 : refreshInterval,
// ... (omitting unchanged options for brevity in logic, but I'll write the full block in replacement)
      revalidateOnFocus: false,     // refreshInterval ya garantiza frescura; focus revalidation duplicaría requests
      revalidateOnReconnect: true,
      dedupingInterval: 5000,       // Evitar requests duplicados en 5 segundos
      revalidateIfStale: true,
      onError: (error) => {
        techDebtLogger.error(`Error obteniendo analíticas de ${entityType}:`, error)
      }
    }
  )

  return {
    analytics: data ?? null,
    isLoading,
    error,
    mutate, // Función para revalidar manualmente
    isError: !!error
  }
}

