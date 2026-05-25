
import type { ReportsAnalyticsDataset } from '../../../types/reports-analytics.types'
import type { ExportRow } from './export.types'

export function buildCourseProgressRows(dataset: ReportsAnalyticsDataset): ExportRow[] {
  return dataset.courses.map((course) => ({
    course: course.courseTitle,
    assigned: course.assignedUsers,
    active: course.activeLearners,
    completed: course.completedUsers,
    progress: course.averageProgress,
    overdue: course.overdueAssignments,
    notesCount: course.notesCount,
    sofliaConversations: course.sofliaConversations,
    activities: course.activityCompletionRate,
    score: course.quizAverageScore,
  }))
}
