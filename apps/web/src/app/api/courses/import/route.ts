import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server'

import { validateCourseImportApiKey } from './course-import/api-key'
import { upsertImportedCourse } from './course-import/course-upsert'
import { readCourseImportBody } from './course-import/import-body'
import { insertImportedModules } from './course-import/module-insert'
import { resolveImportedCourseInstructorId } from './course-import/resolve-instructor'
import {
  createServiceClient,
  rollbackImportedCourse,
} from './course-import/service-client'
import { CourseImportPayloadSchema } from './course-import/schemas'

export async function GET() {
  return NextResponse.json(
    {
      config: {
        auth_configured: !!process.env.COURSEFORGE_API_KEY,
        db_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      service: 'soflia-learning-import-api',
      status: 'active',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}

export async function POST(request: Request) {
  try {
    const authError = validateCourseImportApiKey(request)
    if (authError) {
      return authError
    }

    const bodyResult = await readCourseImportBody(request)
    if (!bodyResult.success) {
      return bodyResult.response
    }

    if (bodyResult.body.type === 'ping') {
      return NextResponse.json({
        environment: process.env.NODE_ENV,
        message: 'Pong: Connection Successful',
        timestamp: new Date().toISOString(),
      })
    }

    const validation = CourseImportPayloadSchema.safeParse(bodyResult.body)
    if (!validation.success) {
      techDebtLogger.error('[IMPORT API] Validation Error:', validation.error.format())
      return NextResponse.json(
        { details: validation.error.format(), error: 'Validation Error' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const instructorId = await resolveImportedCourseInstructorId(
      supabase,
      bodyResult.body
    )
    const course = await upsertImportedCourse(
      supabase,
      validation.data.course,
      instructorId
    )

    try {
      await insertImportedModules(supabase, course.id, instructorId, validation.data.modules)
      return NextResponse.json({
        course_id: course.id,
        message: 'Course imported successfully with enhanced details.',
        success: true,
      })
    } catch (insertError: unknown) {
      techDebtLogger.error('[IMPORT API] Error inserting modules/lessons:', insertError)
      await rollbackImportedCourse(supabase, course.id)

      return NextResponse.json(
        {
          details: insertError instanceof Error ? insertError.message : String(insertError),
          error: 'Partial processing failure. Rolled back.',
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    techDebtLogger.error('[IMPORT API] Unexpected error:', error)
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : String(error),
        error: 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}
