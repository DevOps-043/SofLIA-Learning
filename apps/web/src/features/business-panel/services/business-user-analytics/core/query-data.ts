import { ActivityCompletionRecord } from './activity-completion-record'
import { ActivityEvaluationRecord } from './activity-evaluation-record'
import { ActivitySubmissionRecord } from './activity-submission-record'
import { AssignmentRecord } from './assignment-record'
import { CertificateRecord } from './certificate-record'
import { CourseLessonRecord } from './course-lesson-record'
import { EnrollmentRecord } from './enrollment-record'
import { LessonActivityRecord } from './lesson-activity-record'
import { LessonNoteRecord } from './lesson-note-record'
import { LessonProgressRecord } from './lesson-progress-record'
import { LessonTrackingRecord } from './lesson-tracking-record'
import { LiaConversationRecord } from './lia-conversation-record'
import { LiaMessageRecord } from './lia-message-record'
import { QuizSubmissionRecord } from './quiz-submission-record'
import { StudySessionRecord } from './study-session-record'
import { UserSessionRecord } from './user-session-record'

export interface QueryData {
  assignments: AssignmentRecord[]
  enrollments: EnrollmentRecord[]
  courseLessons: CourseLessonRecord[]
  lessonActivities: LessonActivityRecord[]
  lessonProgress: LessonProgressRecord[]
  activitySubmissions: ActivitySubmissionRecord[]
  activityCompletions: ActivityCompletionRecord[]
  activityEvaluations: ActivityEvaluationRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  studySessions: StudySessionRecord[]
  lessonNotes: LessonNoteRecord[]
  quizSubmissions: QuizSubmissionRecord[]
  certificates: CertificateRecord[]
  userSessions: UserSessionRecord[]
  lessonTracking: LessonTrackingRecord[]
}
