import type { MetricRow, SummaryCardIcon, ThemeTokens } from './types'

export function SummaryCard({
  title,
  icon: Icon,
  rows,
  theme,
}: {
  title: string
  icon: SummaryCardIcon
  rows: MetricRow[]
  theme: ThemeTokens
}) {
  return (
    <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold" style={{ color: theme.textColor }}>{title}</h2>
      </div>
      <div className="space-y-3">
        {rows.map(([label, value], index) => (
          <div key={`${label}-${index}`} className="flex items-start justify-between gap-4 border-b pb-2 last:border-b-0 last:pb-0" style={{ borderColor: theme.dividerColor }}>
            <span className="min-w-0 text-sm leading-5" style={{ color: theme.subtextColor }}>{label}</span>
            <span className="shrink-0 text-right text-sm font-semibold leading-5" style={{ color: theme.textColor }}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
