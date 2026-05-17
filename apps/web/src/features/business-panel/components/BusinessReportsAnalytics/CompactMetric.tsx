import type { ThemeTokens } from './types'

export function CompactMetric({ label, value, theme }: { label: string; value: string; theme: ThemeTokens }) {
  return (
    <div className="rounded-lg px-2 py-2" style={{ backgroundColor: theme.cardBg }}>
      <div className="text-[10px] uppercase tracking-[0.08em]" style={{ color: theme.mutedTextColor }}>{label}</div>
      <div className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>{value}</div>
    </div>
  )
}
