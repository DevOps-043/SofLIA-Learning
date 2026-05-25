import { Check } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../../types'

interface PreviewPointsProps {
  loading?: boolean
  points: string[]
  orgColors: BusinessUserDashboardColors
}

export function PreviewPoints({ loading, points, orgColors }: PreviewPointsProps) {
  if (loading) {
    return (
      <div className="mt-4 space-y-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-4 rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${orgColors.textMuted} 12.5%, transparent)` }}
          />
        ))}
      </div>
    )
  }

  return (
    <ul className="mt-4 space-y-2">
      {points.map((point) => (
        <li key={point} className="flex gap-2 text-sm leading-snug" style={{ color: orgColors.text }}>
          <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: orgColors.iconColor }} />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  )
}
