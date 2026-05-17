export interface ProactiveAnalysis {
  conflicts: Array<{
    sessionTitle: string
    sessionId: string
    sessionDate: string
    sessionTime: string
    conflictingEvent: string
    conflictTime: string
    suggestedAlternatives: string[]
  }>
  overloadedDays: Array<{
    date: string
    totalHours: number
    events: string[]
    suggestion: string
  }>
  missedSessions: Array<{
    sessionTitle: string
    sessionId: string
    originalTime: string
    suggestedRecoverySlots: string[]
  }>
  overdueSessions: Array<{
    sessionTitle: string
    sessionId: string
    scheduledTime: string
    hoursOverdue: number
    suggestedRecoverySlots: string[]
  }>
  effectivelyCompletedSessions: Array<{
    sessionTitle: string
    sessionId: string
    scheduledEndTime: string
    calendarEventLinked: boolean
    completedEarly: boolean
  }>
  partialSessions: Array<{
    sessionTitle: string
    sessionId: string
    progressPct: number
    remainingMinutes: number
    suggestedCompletionSlots: string[]
  }>
  freeSlots: Array<{
    date: string
    startTime: string
    endTime: string
    duration: number
    suggestion: string
  }>
  weeklyProgress: {
    plannedMinutes: number
    completedMinutes: number
    remainingMinutes: number
    overdueMinutes: number
    upcomingMinutes: number
    onTrack: boolean
    status: 'neutral' | 'informative' | 'actionable'
    suggestion: string
  }
  consistencyAlert: {
    daysWithoutStudy: number
    lastStudyDate: string | null
    suggestion: string
  } | null
  burnoutRisk: {
    level: 'low' | 'medium' | 'high'
    consecutiveHeavyDays: number
    suggestion: string
  } | null
  patterns: {
    frequentRescheduleTime: string | null
    preferredStudyTime: string | null
    suggestion: string | null
  }
}
