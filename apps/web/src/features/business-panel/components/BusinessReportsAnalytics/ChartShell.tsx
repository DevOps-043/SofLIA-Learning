import type { ReactNode } from 'react'
import type { ThemeTokens } from './types'

export function ChartShell({
  title,
  subtitle,
  theme,
  children,
}: {
  title: string
  subtitle: string
  theme: ThemeTokens
  children: ReactNode
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <h2 className="text-base font-semibold leading-6 sm:text-lg" style={{ color: theme.textColor }}>{title}</h2>
      <p className="mt-1 text-sm leading-5" style={{ color: theme.subtextColor }}>{subtitle}</p>
      <div className="mt-4 h-[320px] min-h-[280px] w-full min-w-0 overflow-hidden sm:h-[300px]">{children}</div>
    </section>
  )
}
