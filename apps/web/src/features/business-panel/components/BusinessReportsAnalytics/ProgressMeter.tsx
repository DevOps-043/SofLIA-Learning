import type { ThemeTokens } from './types'

export function ProgressMeter({
  label,
  value,
  theme,
  color,
}: {
  label: string
  value: number
  theme: ThemeTokens
  color: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span style={{ color: theme.subtextColor }}>{label}</span>
        <span className="font-semibold" style={{ color: theme.textColor }}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
