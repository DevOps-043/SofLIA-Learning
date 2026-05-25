import type { QuizSubmissionEnrollmentRecord } from './quiz-submission-enrollment-record'
import type { Relation } from './relation'

export interface QuizSubmissionRecord {
  submission_id: string
  user_id: string
  enrollment_id: string
  lesson_id: string
  activity_id: string | null
  percentage_score: number | null
  score?: number | null
  total_points?: number | null
  user_answers?: unknown
  is_passed: boolean | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
  user_course_enrollments: Relation<QuizSubmissionEnrollmentRecord>
}
