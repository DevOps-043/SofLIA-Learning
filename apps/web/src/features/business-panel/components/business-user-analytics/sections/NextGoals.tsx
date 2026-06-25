'use client'

import Link from 'next/link'
import { Award, BookOpen, CheckCircle2, ChevronRight, FileText, Target } from 'lucide-react'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { computeGoals, type DashboardGoal } from '../shared/dashboard-utils'

interface NextGoalsProps {
  data:    BusinessUserAnalyticsResponse
  orgSlug: string
}

const GOAL_ICONS: Record<DashboardGoal['icon'], typeof BookOpen> = {
  book:   BookOpen,
  file:   FileText,
  target: Target,
  award:  Award,
}

// Semantic colors per goal type — convey meaning, not branding
const GOAL_COLORS: Record<DashboardGoal['icon'], string> = {
  book:   'text-blue-500   bg-blue-500/10',
  file:   'text-violet-500 bg-violet-500/10',
  target: 'text-amber-500  bg-amber-500/10',
  award:  'text-emerald-500 bg-emerald-500/10',
}

export function NextGoals({ data, orgSlug }: NextGoalsProps) {
  const theme = useBusinessPanelTheme()
  const goals = computeGoals(data, orgSlug)

  return (
    <section
      aria-label="Próximos objetivos"
      className="rounded-2xl border p-6 shadow-sm"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Próximos objetivos</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Lo que deberías hacer ahora para seguir avanzando.
        </p>
      </div>

      {goals.length === 0 ? (
        <AllDoneState />
      ) : (
        <ul className="space-y-3" role="list">
          {goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} theme={theme} />
          ))}
        </ul>
      )}
    </section>
  )
}

function GoalItem({ goal, theme }: { goal: DashboardGoal; theme: ReturnType<typeof useBusinessPanelTheme> }) {
  const Icon       = GOAL_ICONS[goal.icon]
  const colorClass = GOAL_COLORS[goal.icon]

  return (
    <li
      className="flex items-center gap-4 rounded-xl border p-4 transition-opacity hover:opacity-90"
      style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-100">
          {goal.text}
        </p>
        {goal.progress !== undefined ? (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ backgroundColor: theme.borderColor }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${goal.progress}%`, backgroundColor: theme.actionColor }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {goal.progress}%
            </span>
          </div>
        ) : null}
      </div>

      <Link
        href={goal.href}
        className="no-theme inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95"
        style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
      >
        {goal.cta}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </li>
  )
}

function AllDoneState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
      <p className="text-base font-semibold text-gray-800 dark:text-gray-100">¡Todo al día!</p>
      <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
        No tienes pendientes en este período. Sigue así.
      </p>
    </div>
  )
}
