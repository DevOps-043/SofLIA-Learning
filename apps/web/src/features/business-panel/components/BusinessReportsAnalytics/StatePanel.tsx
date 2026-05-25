import type { LucideIcon } from 'lucide-react'
import type { ThemeTokens } from './types'

export function StatePanel({
  theme,
  icon: Icon,
  title,
  message,
  spinning = false,
}: {
  theme: ThemeTokens
  icon: LucideIcon
  title: string
  message: string
  spinning?: boolean
}) {
  return (
    <section className="rounded-lg border p-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          <Icon className={spinning ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
        </div>
        <div>
          <h2 className="font-semibold" style={{ color: theme.textColor }}>{title}</h2>
          <p className="text-sm" style={{ color: theme.subtextColor }}>{message}</p>
        </div>
      </div>
    </section>
  )
}
