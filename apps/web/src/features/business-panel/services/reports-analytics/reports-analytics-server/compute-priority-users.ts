import type {
  ReportsAnalyticsPriorityUser,
  ReportsAnalyticsPriorityUserRiskCause,
  ReportsAnalyticsPriorityUserRiskLevel,
  ReportsAnalyticsUserDetailRow,
} from '../../../types/reports-analytics.types'

const INACTIVE_THRESHOLD_DAYS = 14
const MAX_PRIORITY_USERS = 10
const RISK_LEVEL_ORDER: Record<ReportsAnalyticsPriorityUserRiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function classifyPriorityUser(
  user: ReportsAnalyticsUserDetailRow,
  referenceDate: Date,
): { riskLevel: ReportsAnalyticsPriorityUserRiskLevel; riskCause: ReportsAnalyticsPriorityUserRiskCause } | null {
  if (user.coursesAssigned === 0) return null
  if (
    user.overdueAssignments === 0 &&
    user.coursesCompleted >= user.coursesAssigned
  ) {
    return null
  }

  const inactiveThresholdMs = INACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  const isInactive =
    !user.lastActivityAt ||
    referenceDate.getTime() - new Date(user.lastActivityAt).getTime() > inactiveThresholdMs

  if (user.overdueAssignments > 0) {
    return { riskLevel: 'high', riskCause: 'overdue' }
  }
  if (user.averageProgress === 0) {
    return { riskLevel: 'high', riskCause: 'not_started' }
  }
  if (isInactive) {
    return { riskLevel: 'medium', riskCause: 'inactive' }
  }
  if (user.averageProgress < 25) {
    return { riskLevel: 'medium', riskCause: 'low_progress' }
  }

  return null
}

export function computePriorityUsers(
  userDetails: ReportsAnalyticsUserDetailRow[],
  referenceDate: Date,
): ReportsAnalyticsPriorityUser[] {
  const priorityUsers: ReportsAnalyticsPriorityUser[] = []

  for (const user of userDetails) {
    const classification = classifyPriorityUser(user, referenceDate)
    if (!classification) continue

    priorityUsers.push({
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      jobTitle: user.jobTitle,
      teamName: user.teamName,
      regionName: user.regionName,
      coursesAssigned: user.coursesAssigned,
      overdueAssignments: user.overdueAssignments,
      averageProgress: user.averageProgress,
      lastActivityAt: user.lastActivityAt,
      riskLevel: classification.riskLevel,
      riskCause: classification.riskCause,
    })
  }

  return priorityUsers
    .sort((a, b) => {
      const levelDiff = RISK_LEVEL_ORDER[a.riskLevel] - RISK_LEVEL_ORDER[b.riskLevel]
      if (levelDiff !== 0) return levelDiff
      return b.overdueAssignments - a.overdueAssignments
    })
    .slice(0, MAX_PRIORITY_USERS)
}
