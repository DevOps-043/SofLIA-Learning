'use client'

import { useEffect, useState } from 'react'

export type HubPlatform = 'windows' | 'mac' | 'linux'

/** Best-effort OS detection to pre-select the right installer. */
export function usePlatformDetection(): HubPlatform | null {
  const [platform, setPlatform] = useState<HubPlatform | null>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('windows')) {
      setPlatform('windows')
    } else if (userAgent.includes('mac os') || userAgent.includes('macintosh')) {
      setPlatform('mac')
    } else if (userAgent.includes('linux') || userAgent.includes('x11')) {
      setPlatform('linux')
    }
  }, [])

  return platform
}
