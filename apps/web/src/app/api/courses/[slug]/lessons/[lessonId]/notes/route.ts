import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import {
  loadCourseEnrollments,
  resolveCourseEnrollment,
  type CourseEnrollmentScope,
} from '@/features/courses/services/course-enrollment.server.service'
import { CourseService } from '@/features/courses/services/course.service'
import { NoteService } from '@/features/courses/services/note.service'
import { createAdminClient } from '@/lib/supabase/admin'

export { POST } from './route.post'

/** Returns notes from the exact course enrollment represented by orgId. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 },
      )
    }

    const supabase = createAdminClient()
    const organizationId = request.nextUrl.searchParams.get('orgId')
    let enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
      organizationId,
    )

    // Compatibility for panels that omit orgId: only resolve a single,
    // unambiguous enrollment. Multiple org contexts must identify orgId.
    if (!enrollment && !organizationId) {
      const enrollments = await loadCourseEnrollments(
        supabase,
        currentUser.id,
        course.id,
      )
      if (enrollments.length === 1) {
        enrollment = {
          ...enrollments[0],
          course_id: course.id,
          user_id: currentUser.id,
        } as CourseEnrollmentScope
      }
    }

    const notes = enrollment
      ? await NoteService.getNotesByLesson(
          currentUser.id,
          lessonId,
          enrollment.enrollment_id,
        )
      : []

    return NextResponse.json(notes, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
