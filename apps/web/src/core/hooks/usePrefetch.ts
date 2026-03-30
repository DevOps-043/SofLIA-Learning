'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'

/**
 * Hook para prefetch inteligente de rutas
 * Precarga rutas comunes para navegación instantánea
 */
export function usePrefetch(routes: string[], options: { 
  delay?: number
  priority?: 'high' | 'low'
} = {}) {
  const router = useRouter()
  const { delay = 2000, priority = 'low' } = options

  useEffect(() => {
    // Esperar un tiempo antes de hacer prefetch para no interferir con la carga inicial
    const timer = setTimeout(() => {
      routes.forEach(route => {
        try {
          router.prefetch(route)
        } catch (error) {
        }
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [routes, delay, router])
}

/**
 * Hook para prefetch al hover
 * Precarga una ruta cuando el usuario hace hover sobre un elemento
 */
export function usePrefetchOnHover() {
  const router = useRouter()

  const prefetchOnHover = useCallback((href: string) => {
    return {
      onMouseEnter: () => {
        try {
          router.prefetch(href)
        } catch (error) {
        }
      }
    }
  }, [router])

  return prefetchOnHover
}

/**
 * Hook para prefetch de rutas relacionadas basado en la ruta actual
 * Automáticamente detecta y precarga rutas relacionadas
 */
export function usePrefetchRelated(currentPath: string) {
  const router = useRouter()

  useEffect(() => {
    const relatedRoutes = getRelatedRoutes(currentPath)
    
    // Prefetch después de 1 segundo
    const timer = setTimeout(() => {
      relatedRoutes.forEach(route => {
        try {
          router.prefetch(route)
        } catch (error) {
        }
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentPath, router])
}

/**
 * Determina rutas relacionadas basándose en la ruta actual
 */
function getRelatedRoutes(currentPath: string): string[] {
  // Mapeo de rutas relacionadas
  const routeMap: Record<string, string[]> = {
    '/': ['/dashboard', '/communities', '/my-courses', '/news'],
    '/dashboard': ['/my-courses', '/communities', '/profile', '/statistics'],
    '/communities': ['/communities/ecos-de-liderazgo', '/dashboard', '/profile'],
    '/my-courses': ['/dashboard', '/courses', '/statistics'],
    '/profile': ['/dashboard', '/my-courses', '/statistics'],
    '/news': ['/dashboard', '/communities'],
    '/statistics': ['/dashboard', '/statistics/results'],
    '/questionnaire': ['/dashboard', '/statistics'],
    '/auth': ['/dashboard'],
  }

  // Buscar coincidencias exactas o por prefijo
  for (const [pattern, routes] of Object.entries(routeMap)) {
    if (currentPath === pattern || currentPath.startsWith(pattern + '/')) {
      return routes
    }
  }

  // Rutas por defecto
  return ['/dashboard', '/communities']
}

/**
 * Prefetch estratégico global para rutas críticas
 * Debe llamarse una sola vez en el layout principal
 */
export function usePrefetchCriticalRoutes() {
  const router = useRouter()

  useEffect(() => {
    // Rutas críticas que se precargan después de la carga inicial
    const criticalRoutes = [
      '/dashboard',
      '/communities',
      '/my-courses',
      '/profile',
      '/news'
    ]

    // Esperar 3 segundos después de la carga inicial
    const timer = setTimeout(() => {
      criticalRoutes.forEach(route => {
        try {
          router.prefetch(route)
        } catch (error) {
        }
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])
}
