import { NextRequest, NextResponse } from 'next/server'

import { ensureCourseEnrollmentScope } from '@/features/courses/services/course-enrollment.server.service'
import { SessionService } from '@/features/auth/services/session.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { TablesUpdate } from '@/lib/supabase/types'

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

    // Las escrituras usan el cliente admin (patrón de las demás rutas de
    // progreso): la sesión puede venir del sistema propio de la app sin sesión
    // de Supabase Auth, y con el cliente user-scoped la RLS de
    // user_lesson_progress rechaza el INSERT (42501) y filtra el SELECT previo,
    // por lo que el progreso jamás se guardaba. La autorización ya quedó
    // validada arriba (SessionService + ensureCourseEnrollmentScope).
    const writeClient = createAdminClient()
    const now = new Date().toISOString()
    const { data: existingProgress } = await writeClient
      .from('user_lesson_progress')
      .select('progress_id, lesson_status')
      .eq('enrollment_id', enrollment.enrollment_id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existingProgress) {
      const updateData: TablesUpdate<'user_lesson_progress'> = {
        last_accessed_at: now,
        updated_at: now,
      }

      if (existingProgress.lesson_status === 'not_started') {
        updateData.lesson_status = 'in_progress'
        updateData.started_at = now
      }

      await writeClient
        .from('user_lesson_progress')
        .update(updateData)
        .eq('progress_id', existingProgress.progress_id)
    } else {
      const { error: insertError } = await writeClient
        .from('user_lesson_progress')
        .insert({
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

      if (insertError) {
        logger.error('[LessonAccess] Error creando progreso de leccion:', {
          enrollmentId: enrollment.enrollment_id,
          error: insertError,
          lessonId,
        })
      }
    }

    await writeClient
      .from('user_course_enrollments')
      .update({ last_accessed_at: now })
      .eq('enrollment_id', enrollment.enrollment_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    // El tracking de acceso no debe romper la carga de la lección, pero el
    // fallo tampoco debe ser invisible en producción.
    logger.error('[LessonAccess] Error registrando acceso a leccion:', error)
    return NextResponse.json({ success: true })
  }
}
