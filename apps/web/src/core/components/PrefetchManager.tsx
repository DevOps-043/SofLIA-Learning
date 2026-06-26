'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useDevicePerformanceMode } from '@/lib/utils/mobile-performance'
import { resolvePrefetchRoutes } from './prefetch-manager.service'

type WindowWithIdleCallback = Window & {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
}

// Waiting at least 3 s after mount avoids competing with the JS chunks and API
// calls the page itself needs to become interactive. On constrained devices the
// delay is longer (6 s) to further reduce main-thread contention.
const FAST_PREFETCH_DELAY_MS = 3000
const CONSERVATIVE_PREFETCH_DELAY_MS = 6000
const IDLE_PREFETCH_TIMEOUT_MS = 8000

/**
 * Global route prefetcher.
 *
 * It warms the most likely next routes after the current page is interactive.
 * On constrained devices it still prefetches a small set, but waits longer and
 * uses requestIdleCallback to avoid competing with initial render or video.
 */
export function PrefetchManager() {
  const router = useRouter()
  const pathname = usePathname()
  const performanceMode = useDevicePerformanceMode()

  useEffect(() => {
    const routesToPrefetch = resolvePrefetchRoutes(pathname || '/', {
      conserveResources: performanceMode.deferPrefetch,
    })

    if (routesToPrefetch.length === 0) {
      return
    }

    let idleCallbackId: number | null = null
    const runPrefetch = () => {
      routesToPrefetch.forEach((route) => {
        try {
          router.prefetch(route)
        } catch {
          // Prefetch is opportunistic; failed prefetch must never block UX.
        }
      })
    }

    const timer = window.setTimeout(
      () => {
        const idleWindow = window as WindowWithIdleCallback

        if (typeof idleWindow.requestIdleCallback === 'function') {
          idleCallbackId = idleWindow.requestIdleCallback(runPrefetch, {
            timeout: IDLE_PREFETCH_TIMEOUT_MS,
          })
          return
        }

        runPrefetch()
      },
      performanceMode.deferPrefetch
        ? CONSERVATIVE_PREFETCH_DELAY_MS
        : FAST_PREFETCH_DELAY_MS,
    )

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

  return null
}
