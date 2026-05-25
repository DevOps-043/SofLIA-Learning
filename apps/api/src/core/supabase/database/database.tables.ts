import type { OrganizationsTable } from './tables/organizations.table'
import type { OrganizationUsersTable } from './tables/organization-users.table'
import type { OrganizationCourseAssignmentsTable } from './tables/organization-course-assignments.table'
import type { OrganizationNodeUsersTable } from './tables/organization-node-users.table'
import type { OrganizationNodesTable } from './tables/organization-nodes.table'
import type { CoursesTable } from './tables/courses.table'
import type { DailyProgressTable } from './tables/daily-progress.table'
import type { LiaConversationsTable } from './tables/lia-conversations.table'
import type { LiaMessagesTable } from './tables/lia-messages.table'
import type { StudySessionsTable } from './tables/study-sessions.table'
import type { StudyPlansTable } from './tables/study-plans.table'
import type { UserCourseCertificatesTable } from './tables/user-course-certificates.table'
import type { UserCourseEnrollmentsTable } from './tables/user-course-enrollments.table'
import type { UserLessonNotesTable } from './tables/user-lesson-notes.table'
import type { UserLessonProgressTable } from './tables/user-lesson-progress.table'
import type { UserNotificationsTable } from './tables/user-notifications.table'
import type { UsersTable } from './tables/users.table'

export type DatabaseTables = {
  organizations: OrganizationsTable
  organization_users: OrganizationUsersTable
  organization_course_assignments: OrganizationCourseAssignmentsTable
  organization_node_users: OrganizationNodeUsersTable
  organization_nodes: OrganizationNodesTable
  courses: CoursesTable
  daily_progress: DailyProgressTable
  lia_conversations: LiaConversationsTable
  lia_messages: LiaMessagesTable
  study_sessions: StudySessionsTable
  study_plans: StudyPlansTable
  user_course_certificates: UserCourseCertificatesTable
  user_course_enrollments: UserCourseEnrollmentsTable
  user_lesson_notes: UserLessonNotesTable
  user_lesson_progress: UserLessonProgressTable
  user_notifications: UserNotificationsTable
  users: UsersTable
}
