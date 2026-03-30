'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Gestor global de prefetching
 * Precarga rutas estratégicamente basándose en la navegación del usuario
 */
export function PrefetchManager() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Rutas críticas que siempre se precargan
    const criticalRoutes = [
      '/dashboard',
      '/communities',
    ]

    // Mapa de rutas relacionadas por contexto
    const relatedRoutes: Record<string, string[]> = {
      '/': ['/dashboard', '/communities', '/my-courses', '/news'],
      '/dashboard': ['/my-courses', '/communities', '/profile', '/statistics'],
      '/communities': ['/dashboard', '/profile'],
      '/my-courses': ['/dashboard', '/statistics'],
      '/profile': ['/dashboard', '/my-courses'],
      '/news': ['/dashboard', '/communities'],
      '/statistics': ['/dashboard', '/statistics/results'],
      '/questionnaire': ['/dashboard', '/statistics'],
      '/auth': ['/dashboard', '/my-courses'],
    }

    // Encontrar rutas relacionadas con la página actual
    let routesToPrefetch: string[] = []

    // Buscar coincidencia exacta
    if (relatedRoutes[pathname]) {
      routesToPrefetch = relatedRoutes[pathname]
    } else {
      // Buscar por prefijo (para rutas dinámicas como /communities/[slug])
      for (const [pattern, routes] of Object.entries(relatedRoutes)) {
        if (pathname.startsWith(pattern + '/')) {
          routesToPrefetch = routes
          break
        }
      }
    }

    // Si no hay rutas relacionadas específicas, usar las críticas
    if (routesToPrefetch.length === 0) {
      routesToPrefetch = criticalRoutes
    }

    // Hacer prefetch después de 3 segundos para no interferir con la carga inicial
    // Aumentado de 2s a 3s para dar más prioridad a contenido crítico
    const timer = setTimeout(() => {
      routesToPrefetch.forEach(route => {
        try {
          router.prefetch(route)
          if (process.env.NODE_ENV === 'development') {
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
          }
        }
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [pathname, router])

  // Este componente no renderiza nada
  return null
}
