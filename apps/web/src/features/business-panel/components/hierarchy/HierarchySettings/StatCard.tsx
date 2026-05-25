import type { ComponentType } from 'react'

export type StatColor = 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'neutral'

const STAT_COLOR_CLASSES: Record<StatColor, { bg: string; icon: string; value: string }> = {
  blue: {
    bg: 'border-blue-500/10 bg-blue-500/5 dark:border-blue-500/15 dark:bg-blue-500/10',
    icon: 'text-blue-500 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
  },
  purple: {
    bg: 'border-purple-500/10 bg-purple-500/5 dark:border-purple-500/15 dark:bg-purple-500/10',
    icon: 'text-purple-500 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
  },
  cyan: {
    bg: 'border-cyan-500/10 bg-cyan-500/5 dark:border-cyan-500/15 dark:bg-cyan-500/10',
    icon: 'text-cyan-500 dark:text-cyan-400',
    value: 'text-cyan-700 dark:text-cyan-300',
  },
  emerald: {
    bg: 'border-emerald-500/10 bg-emerald-500/5 dark:border-emerald-500/15 dark:bg-emerald-500/10',
    icon: 'text-emerald-500 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    bg: 'border-amber-500/10 bg-amber-500/5 dark:border-amber-500/15 dark:bg-amber-500/10',
    icon: 'text-amber-500 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
  },
  neutral: {
    bg: 'border-neutral-100 bg-neutral-50 dark:border-white/5 dark:bg-white/5',
    icon: 'text-neutral-400 dark:text-white/30',
    value: 'text-neutral-700 dark:text-white/60',
  },
}

export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'neutral',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
  color?: StatColor
}) {
  const colors = STAT_COLOR_CLASSES[color]

  return (
    <div className={`rounded-xl border p-3.5 ${colors.bg}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${colors.icon}`} />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-white/40">
          {label}
        </p>
      </div>
      <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
    </div>
  )
}
