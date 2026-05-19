import type { BusinessUserDashboardColors } from '../../types'

interface CourseTileProgressProps {
  progress: number
  orgColors: BusinessUserDashboardColors
}

export function CourseTileProgress({ progress, orgColors }: CourseTileProgressProps) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs font-bold tabular-nums" style={{ color: orgColors.iconColor }}>
        {Math.round(progress)}%
      </span>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${orgColors.textMuted} 14.1%, transparent)` }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: orgColors.iconColor }}
        />
      </div>
    </div>
  )
}
