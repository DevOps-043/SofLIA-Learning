'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * ⚠️ SECURITY FIX: Componente que limpia datos residuales de localStorage
 * cuando se detecta un cambio de usuario o inconsistencia de sesión.
 * 
 * Este componente debe ser montado en el layout principal de la aplicación.
 */
export function AuthSecurityGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const previousUserIdRef = useRef<string | null>(null)
    const hasInitializedRef = useRef(false)

    useEffect(() => {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') return

        // Limpieza inicial de datos residuales de auth
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true

            // Limpiar auth-storage persistido (puede tener datos de otro usuario)
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
                console.warn('🔒 Security: Limpiando auth-storage residual')
                localStorage.removeItem('auth-storage')
            }

            // Limpiar tokens que podrían estar desincronizados
            const accessToken = localStorage.getItem('accessToken')
            const refreshToken = localStorage.getItem('refreshToken')
            if (accessToken || refreshToken) {
                console.warn('🔒 Security: Limpiando tokens residuales del localStorage')
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
            }
        }

        // Detectar cambio de usuario
        if (!isLoading) {
            const currentUserId = user?.id || null
            const previousUserId = previousUserIdRef.current

            // Si hay un cambio de usuario (incluyendo logout)
            if (previousUserId !== null && currentUserId !== previousUserId) {

                // Limpiar todo el localStorage relacionado con auth
                localStorage.removeItem('auth-storage')
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')

                // Limpiar también el carrito para evitar mezcla de datos
                localStorage.removeItem('shopping-cart-storage')
            }

            previousUserIdRef.current = currentUserId
        }
    }, [user, isLoading])

    return <>{children}</>
}
