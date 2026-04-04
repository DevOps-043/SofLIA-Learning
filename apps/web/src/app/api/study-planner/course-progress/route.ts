import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { logger } from '@/lib/logger';

interface EnrollmentRow {
  enrollment_id: string
}

interface CourseModuleRow {
  module_id: string
}

interface CourseLessonRow {
  lesson_id: string
}

interface CompletedLessonRow {
  lesson_id: string
  is_completed: boolean
  enrollment_id: string | null
}

/**
 * GET /api/study-planner/course-progress
 * Obtiene el número de lecciones completadas de un curso para el usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId') || currentUser.id;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener enrollment si no se proporcionó
    let finalEnrollmentId = enrollmentId;
    if (!finalEnrollmentId) {
      const { data: enrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      finalEnrollmentId = enrollment?.enrollment_id || null;

    }

    // Obtener todas las lecciones del curso para poder filtrar correctamente
    const { data: courseModules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id')
      .eq('course_id', courseId)
      .eq('is_published', true);

    if (modulesError) {
      console.error(`   ❌ Error obteniendo módulos:`, modulesError);
    }

    if (!courseModules || courseModules.length === 0) {

      return NextResponse.json({
        success: true,
        enrollmentId: finalEnrollmentId,
        courseId,
        completedLessonsCount: 0,
        completedLessonIds: []
      });
    }

    const moduleIds = courseModules.map(m => m.module_id);

    // Obtener todas las lecciones del curso
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .in('module_id', moduleIds)
      .eq('is_published', true);

    if (lessonsError) {
      console.error(`   ❌ Error obteniendo lecciones:`, lessonsError);
    }

    if (!courseLessons || courseLessons.length === 0) {

      return NextResponse.json({
        success: true,
        enrollmentId: finalEnrollmentId,
        courseId,
        completedLessonsCount: 0,
        completedLessonIds: []
      });
    }

    const lessonIds = courseLessons.map(l => l.lesson_id);

    // Obtener lecciones completadas del usuario para este curso
    // Primero intentar con enrollment_id si está disponible
    let completedLessons: CompletedLessonRow[] = [];

    if (finalEnrollmentId) {

      const { data, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed, enrollment_id')
        .eq('user_id', userId)
        .eq('enrollment_id', finalEnrollmentId)
        .eq('is_completed', true)
        .in('lesson_id', lessonIds);

      if (progressError) {
        console.error(`   ❌ Error en la consulta:`, progressError);
      }
      if (data && data.length > 0) {
      }

      if (!progressError && data) {
        completedLessons = data;
      } else {
        console.warn(`   ⚠️ Error obteniendo progreso con enrollment_id:`, progressError);
      }
    }

    // Si no hay enrollment_id o no se encontraron lecciones, intentar sin enrollment_id
    // pero filtrando por las lecciones del curso
    if (completedLessons.length === 0) {

      const { data, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed, enrollment_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('lesson_id', lessonIds);

      if (progressError) {
        console.error(`   ❌ Error en consulta fallback:`, progressError);
      }
      if (data && data.length > 0) {
      }

      if (!progressError && data) {
        completedLessons = data;
      } else {
        console.error('   ❌ Error obteniendo progreso de lecciones:', progressError);
        return NextResponse.json(
          { error: 'Error obteniendo progreso', completedLessonsCount: 0 },
          { status: 500 }
        );
      }
    }

    const completedLessonsCount = completedLessons?.length || 0;
    const completedLessonIds = (completedLessons || []).map(l => l.lesson_id);

    if (completedLessonsCount > 0) {
    }

    return NextResponse.json({
      success: true,
      enrollmentId: finalEnrollmentId,
      courseId,
      completedLessonsCount,
      completedLessonIds
    });
  } catch (error) {
    logger.error('Error en course-progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', completedLessonsCount: 0 },
      { status: 500 }
    );
  }
}
