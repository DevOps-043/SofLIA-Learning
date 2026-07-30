'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, BellRing, BookOpenCheck, Check, CheckCircle2, ChevronRight, FileChartColumn, Loader2, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'
import { computeGoals, type DashboardGoal } from '../shared/dashboard-utils'
import styles from '../BusinessUserAnalytics.module.css'

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

const GOAL_ICONS: Record<DashboardGoal['icon'], typeof BookOpenCheck> = {
  book:   BookOpenCheck,
  file:   FileChartColumn,
  target: Target,
  award:  BadgeCheck,
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
      className={`${styles.sectionCard} ${styles.sectionPadding}`}
    >
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <Target className="h-4 w-4" />
          </span>
          <div>
        <h2 className={styles.sectionTitle}>Próximos objetivos</h2>
        <p className={styles.sectionSubtitle}>
          Lo que deberías hacer ahora para seguir avanzando.
        </p>
          </div>
        </div>
      </div>

      {goals.length === 0 ? (
        <AllDoneState />
      ) : (
        <ul className={styles.goalList} role="list">
          {goals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
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
  isOwnProfile,
  orgSlug,
  viewedUserId,
  onNotifyFeedback,
  notifyCopy,
}: {
  goal:              DashboardGoal
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
      className={styles.goalItem}
    >
      <div className={`${styles.goalIcon} ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className={styles.goalCopy}>
        <p className={styles.goalText}>
          {goal.text}
        </p>
        {goal.progress !== undefined ? (
          <div className={styles.goalProgress}>
            <div className={styles.track}>
              <div
                className={styles.trackFill}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <span className={styles.goalPercent}>
              {goal.progress}%
            </span>
          </div>
        ) : null}
      </div>

      {isOwnProfile ? (
        <Link
          href={goal.href}
          className={styles.primaryAction}
        >
          {goal.cta}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <NotifyGoalButton
          goal={goal}
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
  orgSlug,
  viewedUserId,
  onNotifyFeedback,
  copy,
}: {
  goal:              DashboardGoal
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
      className={styles.primaryAction}
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
    <div className={styles.allDone}>
      <span className={styles.allDoneIcon}>
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <p className={styles.allDoneTitle}>¡Todo al día!</p>
      <p className={styles.allDoneText}>
        No tienes pendientes en este período. Sigue así.
      </p>
    </div>
  )
}
