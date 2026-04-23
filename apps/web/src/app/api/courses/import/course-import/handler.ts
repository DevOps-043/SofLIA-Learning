import { NextResponse } from 'next/server'
import { validateCourseForgeApiKey } from './api-key'
import { clearExistingCourseContent } from './content-clear'
import { importCourseContent } from './content-importer'
import { createServiceClient } from './service-client'
import { CourseImportPayloadSchema } from './schemas'
import { CourseImportError, createImportErrorResponse } from './errors'
import { createPingResponse } from './diagnostics'
import { isPingRequest, readJsonBody } from './request-body'
import { resolveCourseSlug } from './slug'
import { resolveInstructorId } from './instructor'
import { upsertImportedCourse } from './course-upsert'

export async function handleCourseImportRequest(request: Request) {
  try {
    validateCourseForgeApiKey(request)
    const body = await readJsonBody(request)
    if (isPingRequest(body)) return createPingResponse()

    const validation = CourseImportPayloadSchema.safeParse(body)
    if (!validation.success) {
      console.error('[IMPORT API] Validation Error:', JSON.stringify(validation.error.format(), null, 2))
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.format() },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()
    const { course: courseData, modules } = validation.data
    const instructorId = await resolveInstructorId(supabase, body)
    const slug = resolveCourseSlug(courseData.title, courseData.slug)
    const course = await upsertImportedCourse(supabase, courseData, instructorId, slug)

    await clearExistingCourseContent(supabase, course.id)
    await importCourseContent(supabase, course.id, instructorId, modules)

    return NextResponse.json({
      success: true,
      course_id: course.id,
      message: 'Course imported successfully with enhanced details.',
    })
  } catch (error) {
    if (error instanceof CourseImportError) return createImportErrorResponse(error)
    console.error('[IMPORT API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
