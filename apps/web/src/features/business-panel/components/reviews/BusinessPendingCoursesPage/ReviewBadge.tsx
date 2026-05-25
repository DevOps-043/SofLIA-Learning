import type { ReviewTone } from './types'

interface ReviewBadgeProps {
  label: string
  tone: ReviewTone
}

export function ReviewBadge({ label, tone }: ReviewBadgeProps) {
  return (
    <span
      className="backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-xl border"
      style={{
        color: tone.color,
        backgroundColor: tone.background,
        borderColor: tone.border,
      }}
    >
      {label}
    </span>
  )
}
