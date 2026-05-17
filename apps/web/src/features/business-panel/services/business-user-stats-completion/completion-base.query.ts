import { logger } from '../../../../lib/utils/logger'
import {
  fetchActivityCompletionRows,
  fetchLessonProgressRows,
  toActivityCompletionRecords,
  toLessonProgressRecords,
} from './completion-base-activity.query'
import {
  fetchAssignmentRows,
  fetchEnrollmentRows,
  toAssignmentRecords,
  toEnrollmentRecords,
} from './completion-base-enrollments.query'
import {
  fetchCertificateRows,
  fetchLessonNoteRows,
  toCertificateRecords,
  toLessonNoteRecords,
} from './completion-base-support.query'
import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type { BaseCompletionQueryData } from './completion.data'

export async function fetchBaseCompletionData(
  supabase: BusinessUserStatsSupabaseClient,
  organizationId: string,
  userId: string,
): Promise<BaseCompletionQueryData> {
  const [
    enrollmentsResult,
    lessonProgressResult,
    activityCompletionsResult,
    lessonNotesResult,
    certificatesResult,
    assignmentsResult,
  ] = await Promise.all([
    fetchEnrollmentRows(supabase, userId),
    fetchLessonProgressRows(supabase, userId),
    fetchActivityCompletionRows(supabase, userId),
    fetchLessonNoteRows(supabase, userId),
    fetchCertificateRows(supabase, userId),
    fetchAssignmentRows(supabase, organizationId, userId),
  ])

  if (enrollmentsResult.error) logger.error('Error fetching enrollments:', enrollmentsResult.error)
  if (lessonProgressResult.error) logger.error('Error fetching lesson progress:', lessonProgressResult.error)
  if (activityCompletionsResult.error) {
    logger.error('Error fetching activity completions:', activityCompletionsResult.error)
  }
  if (lessonNotesResult.error) logger.error('Error fetching lesson notes:', lessonNotesResult.error)
  if (certificatesResult.error) logger.error('Error fetching certificates:', certificatesResult.error)
  if (assignmentsResult.error) logger.error('Error fetching assignments:', assignmentsResult.error)

  return {
    enrollments: toEnrollmentRecords(enrollmentsResult.data),
    lessonProgress: toLessonProgressRecords(lessonProgressResult.data),
    activityCompletions: toActivityCompletionRecords(activityCompletionsResult.data),
    lessonNotes: toLessonNoteRecords(lessonNotesResult.data),
    certificates: toCertificateRecords(certificatesResult.data),
    assignments: toAssignmentRecords(assignmentsResult.data),
  }
}
