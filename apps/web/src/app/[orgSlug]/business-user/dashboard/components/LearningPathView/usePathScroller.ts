import { useCallback, useRef } from 'react'

export function usePathScroller() {
  const scrollerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setScrollerRef = useCallback(
    (pathId: string, node: HTMLDivElement | null) => {
      scrollerRefs.current[pathId] = node
    },
    [],
  )

  const scrollPath = useCallback((pathId: string, direction: 'left' | 'right') => {
    const scroller = scrollerRefs.current[pathId]
    if (!scroller) return

    scroller.scrollBy({
      left: direction === 'right' ? 860 : -860,
      behavior: 'smooth',
    })
  }, [])

  return { scrollPath, setScrollerRef }
}
