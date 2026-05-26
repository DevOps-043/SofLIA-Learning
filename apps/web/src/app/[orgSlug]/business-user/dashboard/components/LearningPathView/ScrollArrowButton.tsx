import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../../types'

interface ScrollArrowButtonProps {
  ariaLabel: string
  direction: 'left' | 'right'
  onClick: () => void
  orgColors: BusinessUserDashboardColors
  tourId?: string
}

export function ScrollArrowButton({
  ariaLabel,
  direction,
  onClick,
  orgColors,
  tourId,
}: ScrollArrowButtonProps) {
  const positionClass = direction === 'left'
    ? 'left-0 -translate-x-1/2'
    : 'right-0 translate-x-1/2'
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight

  return (
    <button
      data-tour-id={tourId}
      type="button"
      onClick={onClick}
      className={`absolute top-[90px] z-10 hidden h-12 w-12 items-center justify-center rounded-full border shadow-lg transition hover:scale-105 md:flex xl:top-[116px] ${positionClass}`}
      style={{
        backgroundColor: orgColors.cardBg,
        borderColor: orgColors.border,
        color: orgColors.text,
      }}
      aria-label={ariaLabel}
    >
      <Icon className="h-6 w-6" />
    </button>
  )
}
