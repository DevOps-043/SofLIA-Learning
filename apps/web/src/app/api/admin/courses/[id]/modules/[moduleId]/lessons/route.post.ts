import { NextRequest, NextResponse } from 'next/server'
import { AdminLessonsService } from '@/features/admin/services/adminLessons.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createCreateLessonErrorResponse } from './route.post.errors'
import {
  parseCreateLessonBody,
  validateCreateLessonBody,
  validateLessonRouteParams,
} from './route.post.validation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> },
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { moduleId, id: courseId } = await params
    const paramError = validateLessonRouteParams(moduleId, courseId)
    if (paramError) return paramError

    const body = await parseCreateLessonBody(request)
    if (body instanceof NextResponse) return body

    const validationError = validateCreateLessonBody(body)
    if (validationError) return validationError

    const lesson = await AdminLessonsService.createLesson(
      moduleId,
      body,
      auth.userId,
    )

    return NextResponse.json({
      success: true,
      lesson,
    })
  } catch (error) {
    return createCreateLessonErrorResponse(error)
  }
}
