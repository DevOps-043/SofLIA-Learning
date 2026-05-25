import type { ActivityMetricsAccumulator } from './activity-metrics-accumulator'

export function createActivityMetricsAccumulator(): ActivityMetricsAccumulator {
  return {
    typeCounts: new Map<string, number>(),
    quizScores: [],
    totalActivities: 0,
    completedActivities: 0,
    totalAttempts: 0,
    totalSeconds: 0,
    timedActivities: 0,
    usersNeedingHelp: new Set<string>(),
    redirects: 0,
    quizPassed: 0,
    quizAttempts: 0,
  }
}
