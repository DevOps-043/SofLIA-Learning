export interface ActivityMetricsAccumulator {
  typeCounts: Map<string, number>
  quizScores: number[]
  totalActivities: number
  completedActivities: number
  totalAttempts: number
  totalSeconds: number
  timedActivities: number
  usersNeedingHelp: Set<string>
  redirects: number
  quizPassed: number
  quizAttempts: number
}
