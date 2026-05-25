import { Loader2, Sparkles } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../../types'

interface PreviewBadgeProps {
  label: string
  loading?: boolean
  orgColors: BusinessUserDashboardColors
}

export function PreviewBadge({ label, loading, orgColors }: PreviewBadgeProps) {
  return (
    <div
      className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{
        backgroundColor: `color-mix(in srgb, ${orgColors.iconColor} 9.4%, transparent)`,
        color: orgColors.iconColor,
      }}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {label}
    </div>
  )
}
