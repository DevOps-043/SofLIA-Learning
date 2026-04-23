import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeOrganizationId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

async function readOrganizationIdFromRequest(request: NextRequest) {
  const bodyText = await request.text();

  if (bodyText.trim().length === 0) {
    return null;
  }

  try {
    const payload = JSON.parse(bodyText) as { organizationId?: unknown };
    return normalizeOrganizationId(payload.organizationId);
  } catch {
    return null;
  }
}

/**
 * POST /api/courses/[slug]/lessons/[lessonId]/access
 * Actualiza last_accessed_at cuando el usuario accede a una lección
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();
    const organizationId = await readOrganizationIdFromRequest(request);

    // Verificar autenticación
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const courseId = course.id;

    // Obtener o crear enrollment del usuario
    let enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      courseId,
      organizationId,
    );

    // Si no existe enrollment, crearlo
    if (!enrollment) {
      const now = new Date().toISOString();
      const { data: newEnrollment, error: createError } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: currentUser.id,
          course_id: courseId,
          organization_id: organizationId,
          enrollment_status: 'active',
          overall_progress_percentage: 0,
          enrolled_at: now,
          started_at: now,
          last_accessed_at: now,
        })
        .select('enrollment_id')
        .single();

      if (createError || !newEnrollment) {
        return NextResponse.json(
          { error: 'Error al crear inscripción' },
          { status: 500 }
        );
      }

      enrollment = {
        ...newEnrollment,
        organization_id: organizationId,
        overall_progress_percentage: 0,
        enrollment_status: 'active',
        enrolled_at: now,
        last_accessed_at: now,
      };
    }

    const enrollmentId = enrollment.enrollment_id;
    const now = new Date().toISOString();

    // Verificar si existe progreso de la lección
    const { data: existingProgress } = await supabase
      .from('user_lesson_progress')
      .select('progress_id, lesson_status')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      interface LessonProgressUpdate {
        last_accessed_at: string
        updated_at: string
        lesson_status?: string
        started_at?: string
      }

      const updateData: LessonProgressUpdate = {
        last_accessed_at: now,
        updated_at: now,
      };

      if (existingProgress.lesson_status === 'not_started') {
        updateData.lesson_status = 'in_progress';
        updateData.started_at = now;
      }

      const { error: updateError } = await supabase
        .from('user_lesson_progress')
        .update(updateData)
        .eq('progress_id', existingProgress.progress_id);

      if (updateError) {
        // No retornar error, es solo tracking
        return NextResponse.json({ success: true });
      }
    } else {
      // Crear nuevo progreso si no existe
      const { error: insertError } = await supabase
        .from('user_lesson_progress')
        .insert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          lesson_status: 'in_progress',
          video_progress_percentage: 0,
          current_time_seconds: 0,
          is_completed: false,
          started_at: now,
          last_accessed_at: now,
        });

      if (insertError) {
        // No retornar error, es solo tracking
        return NextResponse.json({ success: true });
      }
    }

    // Actualizar last_accessed_at del enrollment
    await supabase
      .from('user_course_enrollments')
      .update({ last_accessed_at: now })
      .eq('enrollment_id', enrollmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Lesson access tracking is fire-and-forget — never fail the client.
    // Log so broken tracking is visible in production.
    console.warn('[LessonAccess] Tracking failed silently', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: true });
  }
}
