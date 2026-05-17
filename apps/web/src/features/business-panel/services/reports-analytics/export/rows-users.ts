
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import type { ExportRow } from './export.types'

export function buildUserDetailRows(dataset: ReportsAnalyticsDataset): ExportRow[] {
  return dataset.userDetails.map((user) => ({
    user: user.displayName,
    email: user.email,
    status: user.status,
    role: user.role,
    jobTitle: user.jobTitle,
    gender: user.gender,
    age: user.age ?? '',
    ageBand: user.ageBand,
    region: user.regionName,
    zone: user.zoneName,
    team: user.teamName,
    assigned: user.coursesAssigned,
    completed: user.coursesCompleted,
    progress: user.averageProgress,
    overdue: user.overdueAssignments,
    lessons: user.completedLessons,
    minutes: user.timeSpentMinutes,
    sofliaConversations: user.sofliaConversations,
    sofliaMessages: user.sofliaMessages,
    notes: user.notesCreated,
    activities: user.activitiesCompleted,
    attempts: user.activityAttempts,
    evaluations: user.quizAttempts,
    score: user.quizAverageScore,
    quality: user.qualityScore,
    planned: user.plannedSessions,
    plannerDone: user.completedSessions,
    plannerMissed: user.missedSessions,
    plannerRate: user.plannerAdherenceRate,
    lastConnection: user.lastConnectionAt || '',
    lastActivity: user.lastActivityAt || '',
  }))
}
