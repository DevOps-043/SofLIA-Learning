import { InfoHoverCard } from './InfoHoverCard'
import type { BusinessUserDashboardColors } from '../../types'
import type { InfoHoverCardState, LearningPathTranslator } from './types'

interface LearningPathHoverLayerProps {
  card: InfoHoverCardState | null
  orgColors: BusinessUserDashboardColors
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClose: () => void
  t: LearningPathTranslator
}

export function LearningPathHoverLayer({
  card,
  orgColors,
  onMouseEnter,
  onMouseLeave,
  onClose,
  t,
}: LearningPathHoverLayerProps) {
  if (!card) return null

  return (
    <>
      <div className="fixed inset-0 z-[79] md:hidden" onClick={onClose} aria-hidden="true" />
      <InfoHoverCard
        card={card}
        orgColors={orgColors}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClose={onClose}
        t={t}
      />
    </>
  )
}
