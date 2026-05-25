'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CourseHoverContent } from './CourseHoverContent'
import { useCourseHoverPopover } from './useCourseHoverPopover'
import type { CourseHoverPopoverProps } from './types'

export function CourseHoverPopover({
  course,
  isVisible,
  cardRef,
  onMouseEnter,
  onMouseLeave: _onMouseLeave,
  onClose,
}: CourseHoverPopoverProps) {
  const popover = useCourseHoverPopover({
    cardRef,
    isVisible,
    onClose,
    onMouseEnter,
  })

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={popover.popoverRef}
          className="fixed z-50 w-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-500/30 dark:bg-carbon-800"
          style={{
            top: `${popover.position.top}px`,
            left: `${popover.position.left}px`,
            fontFamily: 'Inter, sans-serif',
          }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.2,
          }}
          onMouseEnter={popover.handleMouseEnter}
          onMouseLeave={popover.handleMouseLeave}
        >
          <button
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 rounded-full bg-gray-100 p-1.5 text-gray-500 shadow-sm transition-colors duration-200 hover:bg-gray-200 dark:bg-carbon-900 dark:text-white/80 dark:hover:bg-gray-500/30"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>

          <CourseHoverContent course={course} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
