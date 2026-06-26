import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'

export type KpiStatus = 'neutral' | 'success' | 'warning' | 'danger'
export type ComplianceStatus = 'atRisk' | 'acceptable' | 'healthy'
export type ProgressStatus = 'low' | 'medium' | 'good' | 'excellent'

export interface ExecutiveKpi {
  id: string
  value: number
  formatted: string
  subtitle: string
  status: KpiStatus
  statusLabel?: string
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function progressStatus(value: number): ProgressStatus {
  if (value >= 90) return 'excellent'
  if (value >= 70) return 'good'
  if (value >= 40) return 'medium'
  return 'low'
}

function progressKpiStatus(status: ProgressStatus): KpiStatus {
  if (status === 'excellent' || status === 'good') return 'success'
  if (status === 'medium') return 'warning'
  return 'warning'
}

export function complianceStatus(value: number): ComplianceStatus {
  if (value >= 75) return 'healthy'
  if (value >= 50) return 'acceptable'
  return 'atRisk'
}

function complianceKpiStatus(status: ComplianceStatus): KpiStatus {
  if (status === 'healthy') return 'success'
  if (status === 'acceptable') return 'warning'
  return 'danger'
}

export function deriveExecutiveKpis(
  data: Pick<ReportsAnalyticsResponse, 'overview' | 'learning'>,
  t: (key: string) => string,
): ExecutiveKpi[] {
  const ov = data.overview
  const lrn = data.learning

  const progStatus = progressStatus(ov.averageProgress)
  const complStatus = complianceStatus(ov.complianceRate)

  return [
    {
      id: 'assignedUsers',
      value: ov.assignedUsersCount,
      formatted: String(ov.assignedUsersCount),
      subtitle: t('reportsAnalytics.overview.totalUsers') + ': ' + ov.totalUsers,
      status: 'neutral',
    },
    {
      id: 'activeUsers',
      value: ov.activeLearners,
      formatted: String(ov.activeLearners),
      subtitle: formatPercent(ov.activeLearnerRate) + ' ' + t('reportsAnalytics.overview.assignedUsers').toLowerCase(),
      status: ov.activeLearnerRate >= 60 ? 'success' : 'warning',
    },
    {
      id: 'averageProgress',
      value: ov.averageProgress,
      formatted: formatPercent(ov.averageProgress),
      subtitle: t('reportsAnalytics.progressStatus.' + progStatus),
      status: progressKpiStatus(progStatus),
      statusLabel: t('reportsAnalytics.progressStatus.' + progStatus),
    },
    {
      id: 'completionRate',
      value: ov.completionRate,
      formatted: formatPercent(ov.completionRate),
      subtitle: lrn.completedCourses + ' / ' + lrn.assignedCourses + ' ' + t('reportsAnalytics.metrics.totalActivities').toLowerCase(),
      status: ov.completionRate >= 70 ? 'success' : ov.completionRate >= 40 ? 'warning' : 'danger',
    },
    {
      id: 'atRiskUsers',
      value: ov.atRiskUsersCount,
      formatted: String(ov.atRiskUsersCount),
      subtitle: formatPercent(ov.atRiskRate) + ' ' + t('reportsAnalytics.overview.assignedUsers').toLowerCase(),
      status: ov.atRiskUsersCount > 0 ? 'danger' : 'success',
    },
    {
      id: 'compliance',
      value: ov.complianceRate,
      formatted: formatPercent(ov.complianceRate),
      subtitle: t('reportsAnalytics.compliance.' + complStatus),
      status: complianceKpiStatus(complStatus),
      statusLabel: t('reportsAnalytics.compliance.' + complStatus),
    },
  ]
}
