'use client'

import { PlanSummaryActions } from './PlanSummaryActions'
import { PlanSummaryAlerts } from './PlanSummaryAlerts'
import { PlanSummaryCoursesCard } from './PlanSummaryCoursesCard'
import { PlanSummaryEstimatesCard } from './PlanSummaryEstimatesCard'
import { PlanSummaryHeader } from './PlanSummaryHeader'
import { PlanSummaryOverviewGrid } from './PlanSummaryOverviewGrid'
import { PlanSummaryScheduleCard } from './PlanSummaryScheduleCard'
import { PlanSummarySessionConfigCard } from './PlanSummarySessionConfigCard'
import type { PlanSummaryProps } from './PlanSummary.types'
import { getPlanSummaryStats } from './plan-summary.utils'

export function PlanSummary({
  config,
  sessions,
  courses,
  onEdit,
  onConfirm,
  onCancel,
  isLoading = false,
  warnings = [],
  errors = [],
}: PlanSummaryProps) {
  const stats = getPlanSummaryStats(config, sessions)

  return (
    <div className="space-y-6">
      <PlanSummaryHeader />
      <PlanSummaryAlerts errors={errors} warnings={warnings} />
      <PlanSummaryOverviewGrid config={config} />
      <PlanSummaryCoursesCard courses={courses} />
      <PlanSummarySessionConfigCard config={config} totalSessions={stats.totalSessions} />
      <PlanSummaryScheduleCard
        config={config}
        preferredDaysFormatted={stats.preferredDaysFormatted}
      />
      <PlanSummaryEstimatesCard stats={stats} />
      <PlanSummaryActions
        errors={errors}
        isLoading={isLoading}
        onCancel={onCancel}
        onConfirm={onConfirm}
        onEdit={onEdit}
      />
    </div>
  )
}

export default PlanSummary
