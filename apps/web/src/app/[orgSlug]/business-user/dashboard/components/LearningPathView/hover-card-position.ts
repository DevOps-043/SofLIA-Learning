export function getHoverCardPosition(rect: DOMRect) {
  const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 720 : window.innerHeight
  const gap = 12

  if (viewportWidth < 768) {
    const width = Math.min(380, viewportWidth - 32)
    const maxHeight = Math.min(460, viewportHeight * 0.72)
    const left = (viewportWidth - width) / 2
    const top = Math.max(gap, viewportHeight - maxHeight - 80)
    return { left, top, width, maxHeight, arrowSide: 'none' as const }
  }

  const width = 380
  const maxHeight = Math.min(520, viewportHeight - gap * 2)
  const fitsRight = rect.right + gap + width <= viewportWidth - gap
  const fitsLeft = rect.left - gap - width >= gap
  const left = fitsRight
    ? rect.right + gap
    : fitsLeft
      ? rect.left - gap - width
      : Math.max(gap, Math.min(rect.left, viewportWidth - width - gap))
  const top = Math.max(gap, Math.min(rect.top - 110, viewportHeight - maxHeight - gap))

  return {
    left,
    top,
    width,
    maxHeight,
    arrowSide: fitsRight ? 'left' : fitsLeft ? 'right' : 'none',
  } as const
}
