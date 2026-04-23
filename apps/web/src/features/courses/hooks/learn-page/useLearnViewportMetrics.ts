import { useCallback, useEffect, useState } from 'react'

export function useLearnViewportMetrics() {
  const [isMobile, setIsMobile] = useState(false)
  const [screenHeight, setScreenHeight] = useState(0)
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(
    null,
  )

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setScreenHeight(window.innerHeight)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setVisualViewportHeight(null)
      return
    }

    if (!window.visualViewport) {
      const handleResize = () => setVisualViewportHeight(window.innerHeight)
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const updateViewportHeight = () => {
      setVisualViewportHeight(window.visualViewport?.height || null)
    }

    updateViewportHeight()
    window.visualViewport.addEventListener('resize', updateViewportHeight)
    window.visualViewport.addEventListener('scroll', updateViewportHeight)

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportHeight)
      window.visualViewport?.removeEventListener('scroll', updateViewportHeight)
    }
  }, [isMobile])

  const getInputAreaPadding = useCallback((): string => {
    if (!isMobile) {
      return '1rem'
    }

    if (screenHeight < 600) {
      return 'calc(0.75rem + max(env(safe-area-inset-bottom, 0px), 4px))'
    }

    return 'calc(1rem + max(env(safe-area-inset-bottom, 0px), 8px))'
  }, [isMobile, screenHeight])

  return {
    isMobile,
    screenHeight,
    visualViewportHeight,
    getInputAreaPadding,
  }
}
