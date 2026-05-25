import { useCallback, useEffect, useRef } from 'react'
import type { FocusEvent, KeyboardEvent, MouseEvent, TouchEvent } from 'react'
import type { AssignedCourse, AssignedLearningPathItem } from '../../types'
import { buildCoursePreviewContent } from './preview-content'
import type { InfoHoverCardContent, LearningPathTranslator } from './types'

interface UseCourseTileInteractionsArgs {
  canOpen: boolean
  course: AssignedCourse
  item: AssignedLearningPathItem
  learningPathTitle: string
  onOpen: () => void
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  t: LearningPathTranslator
}

export function useCourseTileInteractions({
  canOpen,
  course,
  item,
  learningPathTitle,
  onOpen,
  onPreview,
  onPreviewEnd,
  t,
}: UseCourseTileInteractionsArgs) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressActiveRef = useRef(false)
  const isTouchActiveRef = useRef(false)

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current === null) return
    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }, [])

  useEffect(() => () => {
    cancelLongPress()
    if (touchResetTimerRef.current !== null) {
      clearTimeout(touchResetTimerRef.current)
    }
  }, [cancelLongPress])

  const previewContent = useCallback(
    () => buildCoursePreviewContent(course, item, learningPathTitle, t),
    [course, item, learningPathTitle, t],
  )

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (!canOpen) return
    isTouchActiveRef.current = true
    isLongPressActiveRef.current = false
    const target = event.currentTarget
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true
      longPressTimerRef.current = null
      onPreview(target, previewContent())
    }, 500)
  }

  const handleTouchEnd = () => {
    cancelLongPress()
    touchResetTimerRef.current = setTimeout(() => {
      isTouchActiveRef.current = false
    }, 600)
  }

  const handleClick = () => {
    if (!canOpen) return
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false
      return
    }
    onOpen()
  }

  const handleMouseEnter = (event: MouseEvent<HTMLElement>) => {
    if (!isTouchActiveRef.current) onPreview(event.currentTarget, previewContent())
  }

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    if (!isTouchActiveRef.current) onPreview(event.currentTarget, previewContent())
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canOpen || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    onOpen()
  }

  return {
    handleBlur: onPreviewEnd,
    handleClick,
    handleFocus,
    handleKeyDown,
    handleMouseEnter,
    handleMouseLeave: onPreviewEnd,
    handleTouchEnd,
    handleTouchMove: cancelLongPress,
    handleTouchStart,
  }
}
