'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, BellRing, BookOpen, Check, CheckCircle2, ChevronRight, FileText, Loader2, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { computeGoals, type DashboardGoal } from '../shared/dashboard-utils'

interface NextGoalsProps {
  data:    BusinessUserAnalyticsResponse
  orgSlug: string
  /** True when the viewer is looking at their own stats — shows action CTAs.
   *  False when a Business admin is viewing another employee — shows "Notificar" instead. */
  isOwnProfile:      boolean
  /** Id of the employee being viewed. Required to send a reminder when !isOwnProfile. */
  viewedUserId?:     string
  onNotifyFeedback?: (message: string, type: ToastType) => void
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

interface NotifyGoalCopy {
  send: string
  sending: string
  sent: string
  success: string
  error: string
}

export function NextGoals({ data, orgSlug, isOwnProfile, viewedUserId, onNotifyFeedback }: NextGoalsProps) {
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('common')
  const goals = computeGoals(data, orgSlug)
  const notifyCopy: NotifyGoalCopy = {
    send: t('actions.sendReminder'),
    sending: t('actions.sending'),
    sent: t('actions.sent'),
    success: t('actions.reminderSent'),
    error: t('actions.reminderError'),
  }

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
            <GoalItem
              key={goal.id}
              goal={goal}
              theme={theme}
              isOwnProfile={isOwnProfile}
              orgSlug={orgSlug}
              viewedUserId={viewedUserId}
              onNotifyFeedback={onNotifyFeedback}
              notifyCopy={notifyCopy}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function GoalItem({
  goal,
  theme,
  isOwnProfile,
  orgSlug,
  viewedUserId,
  onNotifyFeedback,
  notifyCopy,
}: {
  goal:              DashboardGoal
  theme:             ReturnType<typeof useBusinessPanelTheme>
  isOwnProfile:      boolean
  orgSlug:           string
  viewedUserId?:     string
  onNotifyFeedback?: (message: string, type: ToastType) => void
  notifyCopy:        NotifyGoalCopy
}) {
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

      {isOwnProfile ? (
        <Link
          href={goal.href}
          className="no-theme inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95"
          style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
        >
          {goal.cta}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <NotifyGoalButton
          goal={goal}
          theme={theme}
          orgSlug={orgSlug}
          viewedUserId={viewedUserId}
          onNotifyFeedback={onNotifyFeedback}
          copy={notifyCopy}
        />
      )}
    </li>
  )
}

type NotifyState = 'idle' | 'sending' | 'sent'

function NotifyGoalButton({
  goal,
  theme,
  orgSlug,
  viewedUserId,
  onNotifyFeedback,
  copy,
}: {
  goal:              DashboardGoal
  theme:             ReturnType<typeof useBusinessPanelTheme>
  orgSlug:           string
  viewedUserId?:     string
  onNotifyFeedback?: (message: string, type: ToastType) => void
  copy:              NotifyGoalCopy
}) {
  const [state, setState] = useState<NotifyState>('idle')

  const handleNotify = async () => {
    if (!viewedUserId || state !== 'idle') return
    setState('sending')

    try {
      const res  = await fetch(`/api/${orgSlug}/business/users/${viewedUserId}/goals/remind`, {
        method:  'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ goalId: goal.id, goalText: goal.text, actionHref: goal.href }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || json.success === false) {
        throw new Error(json.error ?? copy.error)
      }

      setState('sent')
      onNotifyFeedback?.(copy.success, 'success')
    } catch (error) {
      setState('idle')
      onNotifyFeedback?.(error instanceof Error ? error.message : copy.error, 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleNotify()}
      disabled={!viewedUserId || state !== 'idle'}
      className="no-theme inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
    >
      {state === 'sending' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {copy.sending}
        </>
      ) : state === 'sent' ? (
        <>
          <Check className="h-3.5 w-3.5" />
          {copy.sent}
        </>
      ) : (
        <>
          <BellRing className="h-3.5 w-3.5" />
          {copy.send}
        </>
      )}
    </button>
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
