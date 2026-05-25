import type { ActivityCompletionRecord } from './activity-completion-record'
import type { ActivityEvaluationRecord } from './activity-evaluation-record'
import type { ActivitySubmissionRecord } from './activity-submission-record'
import type { AssignmentRecord } from './assignment-record'
import type { EnrollmentRecord } from './enrollment-record'
import type { LessonNoteRecord } from './lesson-note-record'
import type { LessonProgressRecord } from './lesson-progress-record'
import type { LiaConversationRecord } from './lia-conversation-record'
import type { LiaMessageRecord } from './lia-message-record'
import type { OrganizationRegionRecord } from './organization-region-record'
import type { OrganizationTeamRecord } from './organization-team-record'
import type { OrganizationUserRecord } from './organization-user-record'
import type { OrganizationZoneRecord } from './organization-zone-record'
import type { QuizSubmissionRecord } from './quiz-submission-record'
import type { StudySessionRecord } from './study-session-record'

export interface AnalyticsQueryData {
  organizationUsers: OrganizationUserRecord[]
  regions: OrganizationRegionRecord[]
  zones: OrganizationZoneRecord[]
  teams: OrganizationTeamRecord[]
  assignments: AssignmentRecord[]
  enrollments: EnrollmentRecord[]
  lessonProgress: LessonProgressRecord[]
  activityCompletions: ActivityCompletionRecord[]
  activitySubmissions: ActivitySubmissionRecord[]
  activityEvaluations: ActivityEvaluationRecord[]
  lessonNotes: LessonNoteRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  quizSubmissions: QuizSubmissionRecord[]
  studySessions: StudySessionRecord[]
}
