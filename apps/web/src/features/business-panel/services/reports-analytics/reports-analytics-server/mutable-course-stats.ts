export interface MutableCourseStats {
  courseId: string
  courseTitle: string
  assignedUsers: Set<string>
  activeLearners: Set<string>
  completedUsers: Set<string>
  progressByUser: Map<string, number>
  overdueAssignments: number
  notesCount: number
  sofliaConversations: number
  activityTotal: number
  activityCompleted: number
  quizScores: number[]
}
