export interface MutableCourseStats {
  courseId: string
  courseTitle: string
  assignedUsers: Set<string>
  activeLearners: Set<string>
  completedUsers: Set<string>
  progressByUser: Map<string, number>
  overdueUsers: Set<string>
  notesCount: number
  sofliaConversations: number
  activityTotal: number
  activityCompleted: number
  quizScores: number[]
}
