'use client'

import useSWR from 'swr'
import { AdminUser, UserStats } from '../services/adminUsers.service'
// Import directo a los modulos puros: el barrel `admin-users` reexporta
// `createAdminClient`, marcado con `server-only`, y romperia el bundle cliente.
import {
  ADMIN_USERS_DEFAULT_PAGE_SIZE,
  ADMIN_USERS_MAX_PAGE_SIZE,
} from '../services/admin-users/helpers'
import type { AdminUserPlatformRole } from '../services/admin-users/types'

interface UseAdminUsersOptions {
  page?: number
  limit?: number
  search?: string
  role?: AdminUserPlatformRole
  organizationId?: string
  courseId?: string
  learningPathId?: string
}

interface UseAdminUsersReturn {
  users: AdminUser[]
  stats: UserStats | null
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  /** Hay una recarga en vuelo mostrando aun los datos previos (cambio de página/filtro). */
  isValidating: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface AdminUsersResponse {
  users: AdminUser[]
  stats: UserStats
  total: number
  page: number
  totalPages: number
}

// 🚀 OPTIMIZACIÓN: Implementar SWR para caché y revalidación automática con paginación
const fetcher = async (url: string): Promise<AdminUsersResponse> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Error al obtener usuarios')
  }

  return response.json()
}

export function useAdminUsers(options: UseAdminUsersOptions = {}): UseAdminUsersReturn {
  const { page = 1, search, role, organizationId, courseId, learningPathId } = options
  // El servidor topa el tamaño de página; pedir más se truncaba en silencio.
  const limit = Math.min(
    options.limit ?? ADMIN_USERS_DEFAULT_PAGE_SIZE,
    ADMIN_USERS_MAX_PAGE_SIZE,
  )

  // Construir URL con parámetros de query
  const params = new URLSearchParams()
  if (page) params.set('page', page.toString())
  if (limit) params.set('limit', limit.toString())
  if (search) params.set('search', search)
  if (role) params.set('role', role)
  if (organizationId) params.set('organizationId', organizationId)
  if (courseId) params.set('courseId', courseId)
  if (learningPathId) params.set('learningPathId', learningPathId)

  const url = `/api/admin/users?${params.toString()}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminUsersResponse>(
    url,
    fetcher,
    {
      // Configuración optimizada para lista de usuarios
      revalidateOnFocus: false,           // No revalidar al hacer focus
      revalidateOnReconnect: true,        // Revalidar al reconectar
      dedupingInterval: 30000,            // Deduplicar requests en 30 segundos
      refreshInterval: 120000,            // Auto-refresh cada 2 minutos
      errorRetryCount: 3,                 // Reintentar 3 veces
      errorRetryInterval: 5000,           // Esperar 5s entre reintentos
      keepPreviousData: true,             // Mantener datos previos mientras recarga
    }
  )

  return {
    users: data?.users ?? [],
    stats: data?.stats ?? null,
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
    refetch: async () => { await mutate() }
  }
}
