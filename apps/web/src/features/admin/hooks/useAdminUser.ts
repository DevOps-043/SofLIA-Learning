'use client'

/**
 * ⚡ OPTIMIZACIÓN CRÍTICA: Hook consolidado con SWR cache
 *
 * ANTES: Custom hook con fetch manual → Sin cache, sin deduplication
 * DESPUÉS: Wrapper de useAuth → Comparte cache SWR global con otros componentes
 *
 * BENEFICIOS:
 * - Cache compartido entre Admin, Instructor, Dashboard
 * - Request deduplication automática
 * - Revalidación inteligente
 * - Reduce fetches duplicados de 3-4 a 1
 */

import { useAuth } from '@/features/auth/hooks/useAuth'

interface AdminUser {
  id: string
  first_name: string
  last_name: string
  email: string
  profile_picture_url?: string
  cargo_rol: string
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
    logo_url?: string
    favicon_url?: string
    slug: string
  }
}

export function useAdminUser() {
  // ⚡ Usar hook centralizado con SWR cache
  const { user: authUser, isLoading: authLoading, mutate } = useAuth()

  // Mapear al formato esperado por componentes admin
  const user: AdminUser | null = authUser
    ? {
        id: authUser.id,
        first_name: authUser.first_name ?? '',
        last_name: authUser.last_name ?? '',
        email: authUser.email ?? '',
        ...(authUser.profile_picture_url
          ? { profile_picture_url: authUser.profile_picture_url }
          : {}),
        cargo_rol: authUser.cargo_rol ?? '',
        created_at: authUser.created_at ?? '',
        updated_at: authUser.updated_at ?? '',
        ...(authUser.organization
          ? {
              organization: {
                id: authUser.organization.id,
                name: authUser.organization.name ?? '',
                ...(authUser.organization.logo_url
                  ? { logo_url: authUser.organization.logo_url }
                  : {}),
                ...(authUser.organization.favicon_url
                  ? { favicon_url: authUser.organization.favicon_url }
                  : {}),
                slug: authUser.organization.slug ?? '',
              },
            }
          : {}),
      }
    : null

  return {
    user,
    isLoading: authLoading,
    error: null, // useAuth ya maneja errores internamente
    refetch: mutate // SWR mutate para revalidar
  }
}
