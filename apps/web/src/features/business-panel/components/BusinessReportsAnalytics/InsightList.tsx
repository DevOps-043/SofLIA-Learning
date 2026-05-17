import type { ThemeTokens } from './types'

export function InsightList({ title, rows, theme }: { title: string; rows: string[]; theme: ThemeTokens }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: theme.borderColor }}>
      <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>{title}</h3>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row} className="text-sm leading-5" style={{ color: theme.subtextColor }}>{row}</li>
        ))}
      </ul>
    </div>
  )
}
