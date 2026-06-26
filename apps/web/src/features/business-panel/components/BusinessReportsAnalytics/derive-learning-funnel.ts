import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'

export interface FunnelStage {
  key: string
  label: string
  value: number
  percentage: number
  dropoffRate: number | null
}

export function deriveLearningFunnel(
  data: Pick<ReportsAnalyticsResponse, 'overview' | 'learning'>,
  t: (key: string) => string,
): FunnelStage[] {
  const dist = data.learning.progressDistribution
  const assigned = data.overview.assignedUsersCount

  if (assigned === 0) return []

  const get = (key: string) => dist.find((d) => d.key === key)?.value ?? 0

  const notStarted = get('not_started')
  const medium = get('medium')
  const high = get('high')
  const almostDone = get('almost_done')
  const completed = get('completed')

  const stages: Array<{ key: string; value: number }> = [
    { key: 'assigned', value: assigned },
    { key: 'started', value: assigned - notStarted },
    { key: 'progress25', value: medium + high + almostDone + completed },
    { key: 'progress50', value: high + almostDone + completed },
    { key: 'progress75', value: almostDone + completed },
    { key: 'completed', value: completed },
  ]

  return stages.map((stage, i) => {
    const prevValue = i === 0 ? null : stages[i - 1].value
    const dropoffRate =
      prevValue !== null && prevValue > 0
        ? Math.round(((prevValue - stage.value) / prevValue) * 100)
        : null

    return {
      key: stage.key,
      label: t('reportsAnalytics.funnel.' + stage.key),
      value: stage.value,
      percentage: assigned > 0 ? Math.round((stage.value / assigned) * 100) : 0,
      dropoffRate,
    }
  })
}
