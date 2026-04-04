import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

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
    let { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', courseId)
      .single();

    // Si no existe enrollment, crearlo
    if (enrollmentError || !enrollment) {
      const now = new Date().toISOString();
      const { data: newEnrollment, error: createError } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: currentUser.id,
          course_id: courseId,
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

      enrollment = newEnrollment;
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
      // Actualizar last_accessed_at y lesson_status si es necesario
      const updateData: Record<string, unknown> = {
        last_accessed_at: now,
        updated_at: now,
      };

      // Si la lección no ha sido iniciada, marcarla como in_progress
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
    // No retornar error, es solo tracking
    return NextResponse.json({ success: true });
  }
}

