import type { BusinessUserDashboardColors } from '../../types'

interface PreviewProgressProps {
  progress?: number
  orgColors: BusinessUserDashboardColors
}

export function PreviewProgress({ progress, orgColors }: PreviewProgressProps) {
  return (
    <div className="mt-3 flex items-center gap-3">
      {typeof progress === 'number' ? (
        <span className="text-sm font-bold tabular-nums" style={{ color: orgColors.iconColor }}>
          {Math.round(progress)}%
        </span>
      ) : null}
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${orgColors.textMuted} 14.1%, transparent)` }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress ?? 0}%`,
            backgroundColor: orgColors.iconColor,
          }}
        />
      </div>
    </div>
  )
}
