import { NextRequest, NextResponse } from 'next/server'

import { ensureCourseEnrollmentScope } from '@/features/courses/services/course-enrollment.server.service'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'

function normalizeOrganizationId(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

async function readOrganizationIdFromRequest(request: NextRequest) {
  const bodyText = await request.text()

  if (bodyText.trim().length === 0) {
    return null
  }

  try {
    const payload = JSON.parse(bodyText) as { organizationId?: unknown }
    return normalizeOrganizationId(payload.organizationId)
  } catch {
    return null
  }
}

/**
 * POST /api/courses/[slug]/lessons/[lessonId]/access
 * Updates last_accessed_at when the user opens a lesson in a validated scope.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const supabase = await createClient()
    const organizationId = await readOrganizationIdFromRequest(request)
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    const enrollment = await ensureCourseEnrollmentScope(
      supabase,
      currentUser.id,
      course.id,
      organizationId,
    )

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No tienes acceso a este curso en este contexto' },
        { status: organizationId ? 403 : 404 },
      )
    }

    const now = new Date().toISOString()
    const { data: existingProgress } = await supabase
      .from('user_lesson_progress')
      .select('progress_id, lesson_status')
      .eq('enrollment_id', enrollment.enrollment_id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existingProgress) {
      const updateData: Record<string, unknown> = {
        last_accessed_at: now,
        updated_at: now,
      }

      if (existingProgress.lesson_status === 'not_started') {
        updateData.lesson_status = 'in_progress'
        updateData.started_at = now
      }

      await supabase
        .from('user_lesson_progress')
        .update(updateData)
        .eq('progress_id', existingProgress.progress_id)
    } else {
      await supabase.from('user_lesson_progress').insert({
        current_time_seconds: 0,
        enrollment_id: enrollment.enrollment_id,
        is_completed: false,
        last_accessed_at: now,
        lesson_id: lessonId,
        lesson_status: 'in_progress',
        organization_id: enrollment.organization_id,
        started_at: now,
        user_id: currentUser.id,
        video_progress_percentage: 0,
      })
    }

    await supabase
      .from('user_course_enrollments')
      .update({ last_accessed_at: now })
      .eq('enrollment_id', enrollment.enrollment_id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
