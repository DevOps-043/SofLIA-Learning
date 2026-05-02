'use client'

import { useEffect, useState } from 'react'
import {
  DEVICE_PERFORMANCE_MEDIA_QUERIES,
  getNetworkInformation,
  resolveBrowserDevicePerformancePolicy,
  type DevicePerformancePolicy,
} from './device-performance-policy'

const DEFAULT_DEVICE_PERFORMANCE_MODE: DevicePerformancePolicy = {
  deferPrefetch: true,
  disableAutoplayAudio: true,
  disableHeavyEffects: true,
  disableSessionRecorder: true,
  isApplePlatform: false,
  isCoarsePointer: false,
  isConstrainedNetwork: false,
  isIOSLike: false,
  isLowDeviceMemory: false,
  isLowHardwareConcurrency: false,
  isMacLike: false,
  isMobile: false,
  isMobileViewport: false,
  isWebKitLike: false,
  prefersReducedMotion: false,
  reducePolling: true,
}

export function useDevicePerformanceMode(): DevicePerformancePolicy {
  const [policy, setPolicy] = useState<DevicePerformancePolicy>(
    DEFAULT_DEVICE_PERFORMANCE_MODE,
  )

  useEffect(() => {
    const sync = () => setPolicy(resolveBrowserDevicePerformancePolicy())

    sync()

    const mediaQueries = DEVICE_PERFORMANCE_MEDIA_QUERIES
      .map((query) => window.matchMedia(query))

    mediaQueries.forEach((query) => query.addEventListener('change', sync))
    window.addEventListener('resize', sync)

    const connection = getNetworkInformation()
    connection?.addEventListener?.('change', sync)

    return () => {
      mediaQueries.forEach((query) => query.removeEventListener('change', sync))
      window.removeEventListener('resize', sync)
      connection?.removeEventListener?.('change', sync)
    }
  }, [])

  return policy
}

export function useMobilePerformanceMode(): DevicePerformancePolicy {
  return useDevicePerformanceMode()
}
