'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useDevicePerformanceMode } from '@/lib/utils/mobile-performance'

type WindowWithIdleCallback = Window & {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
}

/**
 * Gestor global de prefetching
 * Precarga rutas estratégicamente basándose en la navegación del usuario
 */
export function PrefetchManager() {
  const router = useRouter()
  const pathname = usePathname()
  const performanceMode = useDevicePerformanceMode()

  useEffect(() => {
    if (performanceMode.deferPrefetch) {
      return
    }

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
    let idleCallbackId: number | null = null
    const runPrefetch = () => {
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
    }

    const timer = window.setTimeout(() => {
      const idleWindow = window as WindowWithIdleCallback

      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleCallbackId = idleWindow.requestIdleCallback(runPrefetch, {
          timeout: 5000,
        })
        return
      }

      runPrefetch()
    }, 3000)

    return () => {
      window.clearTimeout(timer)

      const idleWindow = window as WindowWithIdleCallback
      if (
        idleCallbackId !== null &&
        typeof idleWindow.cancelIdleCallback === 'function'
      ) {
        idleWindow.cancelIdleCallback(idleCallbackId)
      }
    }
  }, [pathname, performanceMode.deferPrefetch, router])

  // Este componente no renderiza nada
  return null
}
