import { logger } from '../../../lib/logger'
import { extractGeneratedCourseInstructorHint } from './business-course-detail.server.helpers'
import type {
  BusinessCourseDetailSupabaseClient,
  CourseRow,
  GeneratedCourseMetadataClient,
  GeneratedCourseMetadataRow,
  InstructorRow,
} from './business-course-detail.server.types'
import { resolveInstructorHint } from './business-course-generated-instructor-hint.server.service'

export async function resolveGeneratedCourseInstructor(
  supabase: BusinessCourseDetailSupabaseClient,
  course: Pick<CourseRow, 'id' | 'slug'>,
): Promise<InstructorRow | null> {
  const metadataRows = await fetchGeneratedCourseMetadataRows(supabase, course)
  const visitedIds = new Set<string>()
  const visitedEmails = new Set<string>()

  for (const row of metadataRows) {
    const hint = extractGeneratedCourseInstructorHint(row.payload)
    const instructor = await resolveInstructorHint(
      supabase,
      hint,
      visitedIds,
      visitedEmails,
    )
    if (instructor) return instructor
  }

  return null
}

async function fetchGeneratedCourseMetadataRows(
  supabase: BusinessCourseDetailSupabaseClient,
  course: Pick<CourseRow, 'id' | 'slug'>,
): Promise<GeneratedCourseMetadataRow[]> {
  const rows: GeneratedCourseMetadataRow[] = []
  await appendRows(supabase, rows, 'courses_staging', 'course_id', course.id)

  if (course.slug) {
    await appendRows(supabase, rows, 'courses_staging', 'source_slug', course.slug)
    await appendRows(supabase, rows, 'courseengine_inbox', 'course_slug', course.slug)
  }

  return rows
}

async function appendRows(
  supabase: BusinessCourseDetailSupabaseClient,
  rows: GeneratedCourseMetadataRow[],
  table: 'courses_staging' | 'courseengine_inbox',
  column: string,
  value: string,
) {
  try {
    const metadataClient = supabase as unknown as GeneratedCourseMetadataClient
    const { data, error } = await metadataClient
      .from(table)
      .select('payload')
      .eq(column, value)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (error) {
      logger.warn('Error loading generated course metadata', { error, table, column })
      return
    }

    rows.push(...(data || []))
  } catch (error) {
    logger.warn('Generated course metadata lookup failed', { error, table, column })
  }
}
