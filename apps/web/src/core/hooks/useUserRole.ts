'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Roles globales del sistema (platform_role en tabla users)
 *
 * NOTA: 'Business User' ya no existe - todos los usuarios de empresa tienen platform_role='Business'.
 * La diferenciación entre admin/owner y member se hace en organization_users.role
 */
const ROLES = {
  ADMIN: 'administrador',
  INSTRUCTOR: 'instructor',
  BUSINESS: 'business',
  USER: 'usuario'
} as const

/**
 * Hook para verificar el rol global del usuario (platform_role)
 *
 * Para verificar permisos dentro de una organización específica,
 * usa el rol de organization_users.role (owner/admin/member)
 */
export function useUserRole() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isInstructor, setIsInstructor] = useState(false)
  const [isBusiness, setIsBusiness] = useState(false)
  const [isUser, setIsUser] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      // Normalizar con toLowerCase() y trim() para evitar bugs con espacios
      const role = user.platform_role?.toLowerCase().trim()

      setIsAdmin(role === ROLES.ADMIN)
      setIsInstructor(role === ROLES.INSTRUCTOR)
      // Todos los usuarios de empresa tienen platform_role='Business'
      // La diferenciación owner/admin/member se hace en organization_users.role
      setIsBusiness(role === ROLES.BUSINESS)
      setIsUser(role === ROLES.USER)
    } else {
      setIsAdmin(false)
      setIsInstructor(false)
      setIsBusiness(false)
      setIsUser(false)
    }
  }, [user, loading])

  return {
    user,
    isLoading: loading,
    isAdmin,
    isInstructor,
    isBusiness,
    isUser,
    role: user?.platform_role || null
  }
}
