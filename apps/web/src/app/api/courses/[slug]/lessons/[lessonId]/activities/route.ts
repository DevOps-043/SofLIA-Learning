import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';
import { ContentTranslationService } from '@/core/services/contentTranslation.service';
import { SupportedLanguage } from '@/core/i18n/i18n';
import { normalizeLessonActivityRecord } from '@/lib/course-content';

type LessonActivityRecord = Record<string, unknown> & {
  activity_content?: unknown
  activity_id: string
  activity_type?: string | null
  id?: string
}

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/activities
 * Obtiene todas las actividades de una lección (con traducción si está disponible)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('language') || 'es') as SupportedLanguage;
    const supabase = await createClient();

    // Optimización: Obtener curso primero, luego validar lección y módulo en una consulta
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

    // Optimización: Verificar lección y módulo en una sola consulta con JOIN
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        module_id,
        course_modules!inner (
          module_id,
          course_id
        )
      `)
      .eq('lesson_id', lessonId)
      .eq('course_modules.course_id', course.id)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada o no pertenece al curso' },
        { status: 404 }
      );
    }

    // Obtener actividades de la lección
    
    // Check session to confirm user is authenticated (RLS check)
    const { data: { session: debugSession } } = await supabase.auth.getSession();

    const { data: activities, error: activitiesError, count } = await supabase
      .from('lesson_activities')
      .select('*', { count: 'exact' })
      .eq('lesson_id', lessonId)
      .order('activity_order_index', { ascending: true });


    if (activitiesError) {
      console.error('[activities/route] Error obteniendo actividades:', activitiesError);
      return NextResponse.json(
        { error: 'Error al obtener actividades' },
        { status: 500 }
      );
    }

    // IMPORTANTE: Siempre intentar aplicar traducciones, incluso para español
    // Si el contenido original está en inglés/portugués, necesitamos las traducciones a español
    let translatedActivities: LessonActivityRecord[] = (activities ?? []) as LessonActivityRecord[];
    if (translatedActivities.length > 0) {
      try {
        translatedActivities = await ContentTranslationService.translateArray(
          'activity',
          translatedActivities.map((activity) => ({ ...activity, id: activity.activity_id })),
          ['activity_title', 'activity_description', 'activity_content', 'ai_prompts'],
          language,
          supabase // Pasar el cliente del servidor
        );

      } catch (translationError) {
        console.error(`[activities/route] Error aplicando traducciones:`, translationError);
        // Continuar con actividades originales si falla la traducción
      }
    }

    // ⚡ OPTIMIZACIÓN: Agregar cache headers (datos estáticos - 1 hora)
    const normalizedActivities = translatedActivities.map((activity) =>
      normalizeLessonActivityRecord(activity)
    );

    return withCacheHeaders(
      NextResponse.json(normalizedActivities),
      cacheHeaders.private
    );
  } catch (error) {
    console.error('[activities/route] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
