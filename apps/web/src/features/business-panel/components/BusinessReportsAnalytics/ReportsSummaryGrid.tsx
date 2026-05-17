import { Brain, StickyNote, Target } from 'lucide-react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { SummaryCard } from './SummaryCard'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function ReportsSummaryGrid({
  data,
  theme,
  t,
}: {
  data: ReportsAnalyticsResponse
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <SummaryCard
        title={t('reportsAnalytics.sections.soflia')}
        icon={Brain}
        theme={theme}
        rows={[
          [t('reportsAnalytics.metrics.totalConversations'), data.soflia.totalConversations],
          [t('reportsAnalytics.metrics.totalMessages'), data.soflia.totalMessages],
          [t('reportsAnalytics.metrics.averageMessagesPerConversation'), data.soflia.averageMessagesPerConversation],
          [t('reportsAnalytics.metrics.sofliaCompletionRate'), `${data.soflia.completionRate}%`],
        ]}
      />
      <SummaryCard
        title={t('reportsAnalytics.sections.activities')}
        icon={Target}
        theme={theme}
        rows={[
          [t('reportsAnalytics.metrics.totalActivities'), data.activities.totalActivities],
          [t('reportsAnalytics.metrics.completedActivities'), data.activities.completedActivities],
          [t('reportsAnalytics.metrics.totalEvaluations'), data.activities.totalEvaluations],
          [t('reportsAnalytics.metrics.quizAverageScore'), `${data.activities.quizAverageScore}%`],
          [t('reportsAnalytics.metrics.activityCompletionRate'), `${data.activities.completionRate}%`],
        ]}
      />
      <SummaryCard
        title={t('reportsAnalytics.sections.notesPlanner')}
        icon={StickyNote}
        theme={theme}
        rows={[
          [t('reportsAnalytics.metrics.totalNotes'), data.notes.totalNotes],
          [t('reportsAnalytics.metrics.notesAdoptionRate'), `${data.notes.adoptionRate}%`],
          [t('reportsAnalytics.metrics.plannedSessions'), data.planner.plannedSessions],
          [t('reportsAnalytics.metrics.plannerAdherenceRate'), `${data.planner.adherenceRate}%`],
        ]}
      />
    </div>
  )
}
