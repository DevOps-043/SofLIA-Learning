import { roundToTwoDecimals } from './analytics-math.utils'
import type { AnalyticsUser } from './analytics.types'

interface RoleAccumulator {
  distribution: Map<string, number>
  progress: Map<string, { sum: number; count: number }>
  completions: Map<string, number>
  time: Map<string, { sum: number; count: number }>
}

export function buildRoleMetrics(userAnalytics: AnalyticsUser[]) {
  const metrics = createRoleAccumulator()

  for (const user of userAnalytics) {
    metrics.distribution.set(
      user.role,
      (metrics.distribution.get(user.role) ?? 0) + 1,
    )
    incrementAverage(metrics.progress, user.role, user.average_progress)
    incrementAverage(metrics.time, user.role, user.total_time_hours)
    metrics.completions.set(
      user.role,
      (metrics.completions.get(user.role) ?? 0) + user.courses_completed,
    )
  }

  return {
    distribution: Array.from(metrics.distribution.entries()).map(
      ([role, count]) => ({ role, count }),
    ),
    progress_comparison: mapAverage(metrics.progress, 'average_progress'),
    completions: Array.from(metrics.completions.entries()).map(
      ([role, total_completed]) => ({ role, total_completed }),
    ),
    time_spent: mapAverage(metrics.time, 'average_hours'),
  }
}

function createRoleAccumulator(): RoleAccumulator {
  return {
    distribution: new Map(),
    progress: new Map(),
    completions: new Map(),
    time: new Map(),
  }
}

function incrementAverage(
  target: Map<string, { sum: number; count: number }>,
  role: string,
  value: number,
) {
  const current = target.get(role)
  target.set(role, {
    sum: (current?.sum ?? 0) + value,
    count: (current?.count ?? 0) + 1,
  })
}

function mapAverage(
  source: Map<string, { sum: number; count: number }>,
  key: 'average_progress' | 'average_hours',
) {
  return Array.from(source.entries()).map(([role, entry]) => ({
    role,
    [key]: entry.count > 0 ? roundToTwoDecimals(entry.sum / entry.count) : 0,
  }))
}
