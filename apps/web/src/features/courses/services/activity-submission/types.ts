import type { createAdminClient } from '@/lib/supabase/admin'
import type { createClient } from '@/lib/supabase/server'
import type { ResolvedOrganizationAiContext } from '@/lib/lia-context/services/organization-ai-context.service'

import type {
  ActivityConfig,
  ActivitySubmissionStatus,
} from '../../types/activity-config'

export type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

export type CourseRow = {
  id: string
  title: string
  instructor_id: string | null
}

export type EnrollmentRow = {
  enrollment_id: string
  organization_id: string | null
}

export type ActivityLikeRecord = Record<string, unknown> & {
  activity_id: string
  activity_title?: string | null
  activity_description?: string | null
  activity_type?: string | null
  is_required?: boolean | null
  activity_config?: unknown
  requires_soflia_validation?: boolean | null
  external_tool_key?: string | null
  activity_content?: unknown
  ai_prompts?: unknown
}

export type ActivitySubmissionRow = {
  activity_id: string
  created_at: string | null
  evidence_payload: Record<string, unknown> | null
  last_validated_at: string | null
  response_payload: Record<string, unknown>
  response_text: string | null
  status: ActivitySubmissionStatus
  submission_id: string
  submitted_at: string | null
  updated_at: string | null
}

export type ActivitySubmissionMutationPayload = {
  activity_id: string
  course_id: string
  enrollment_id: string
  evidence_payload: Record<string, unknown> | null
  last_validated_at: string | null
  lesson_id: string
  organization_id: string | null
  response_payload: Record<string, unknown>
  response_text: string | null
  status: ActivitySubmissionStatus
  submitted_at: string | null
  updated_at: string
  user_id: string
}

export type ActivityEvaluationRow = {
  created_at: string
  evaluation_id: string
  feedback_payload: unknown
  result_status: 'pass' | 'revise' | 'error'
  submission_id: string
}

export interface CourseLessonContext {
  courseId: string
  courseTitle: string
  enrollmentId: string
  instructorId: string | null
  lessonId: string
  organizationId: string | null
  userId: string
}

export interface CourseActivityContext extends CourseLessonContext {
  activity: ActivityLikeRecord
  organizationAiContext: ResolvedOrganizationAiContext | null
  resolvedActivityConfig: ActivityConfig | null
}
