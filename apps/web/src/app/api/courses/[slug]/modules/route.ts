import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';
import { ContentTranslationService } from '@/core/services/contentTranslation.service';
import { SupportedLanguage } from '@/core/i18n/i18n';

/**
 * GET /api/courses/[slug]/modules
 * Obtiene todos los módulos y lecciones de un curso por slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('lang') || 'es') as SupportedLanguage;
    const supabase = await createClient();

    // Obtener el curso por slug para obtener su ID
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

    // Obtener módulos del curso (incluir todos, no solo publicados, para el panel de admin/instructor)
    // Si no hay módulos publicados, mostrar todos para que el instructor pueda ver su contenido
    const { data: allModules, error: allModulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_order_index,
        module_duration_minutes,
        is_published
      `)
      .eq('course_id', courseId)
      .order('module_order_index', { ascending: true });

    // Filtrar solo los publicados si hay alguno publicado, sino mostrar todos
    const publishedModules = (allModules || []).filter(m => m.is_published === true);
    const modules = publishedModules.length > 0 ? publishedModules : (allModules || []);

    const modulesError = allModulesError;

    if (modulesError) {
      return NextResponse.json(
        { error: 'Error al obtener módulos' },
        { status: 500 }
      );
    }

    // ⚡ OPTIMIZACIÓN: Obtener user y enrollment UNA SOLA VEZ antes del loop
    const currentUser = await SessionService.getCurrentUser();
    let userEnrollment: {
      enrollment_id: string;
      overall_progress_percentage?: number;
    } | null = null;

    if (currentUser) {
      const { data: enrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id, overall_progress_percentage')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .single();

      userEnrollment = enrollment ?? null;
    }

    let allLessonsData: Array<{
      lesson_id: string;
      lesson_title: string;
      lesson_description?: string;
      lesson_order_index: number;
      duration_seconds: number;
      total_duration_minutes?: number; // Tiempo total (video + materiales + actividades)
      video_provider_id?: string;
      video_provider?: string;
      is_published: boolean;
      module_id: string;
    }> = [];

    // IMPORTANTE: Siempre leer de course_lessons (tabla principal)
    // Las traducciones se aplican desde content_translations en el frontend
    if (modules.length > 0) {
      const moduleIds = modules.map((m) => m.module_id);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select(`
          lesson_id,
          lesson_title,
          lesson_description,
          lesson_order_index,
          duration_seconds,
          total_duration_minutes,
          video_provider_id,
          video_provider,
          is_published,
          module_id,
          transcript_content,
          summary_content,
          created_at,
          updated_at,
          instructor_id
        `)
        .in('module_id', moduleIds)
        .order('lesson_order_index', { ascending: true });

      if (lessonsError) {
        console.error('[modules/route] ❌ Error obteniendo lecciones:', lessonsError);
      } else {
      }

      allLessonsData = lessonsData ?? [];
    } else {

    }

    let progressMap = new Map<
      string,
      { is_completed?: boolean; video_progress_percentage?: number }
    >();

    if (userEnrollment && allLessonsData.length > 0) {
      const { data: progressData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed, lesson_status, video_progress_percentage')
        .eq('enrollment_id', userEnrollment.enrollment_id)
        .in(
          'lesson_id',
          allLessonsData.map((lesson) => lesson.lesson_id)
        );

      progressMap = new Map(
        (progressData || []).map((p) => [p.lesson_id, p])
      );
    }

    const lessonsByModule = new Map<string, typeof allLessonsData>();
    allLessonsData.forEach((lesson) => {
      if (!lessonsByModule.has(lesson.module_id)) {
        lessonsByModule.set(lesson.module_id, []);
      }
      lessonsByModule.get(lesson.module_id)!.push(lesson);
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // Aplicar traducciones a módulos y lecciones
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        // Traducir módulo
        const moduleWithId = { ...module, id: module.module_id };
        const translatedModule = await ContentTranslationService.translateObject(
          'module',
          moduleWithId,
          ['module_title', 'module_description'],
          language,
          supabase
        );

        const moduleLessons = lessonsByModule.get(module.module_id) || [];

        const publishedLessons = moduleLessons.filter(
          (lesson) => lesson.is_published === true
        );
        const lessons =
          publishedLessons.length > 0 ? publishedLessons : moduleLessons;

        // Traducir lecciones
        const translatedLessons = await Promise.all(
          lessons.map(async (lesson) => {
            const lessonWithId = { ...lesson, id: lesson.lesson_id };
            const translatedLesson = await ContentTranslationService.translateObject(
              'lesson',
              lessonWithId,
              ['lesson_title', 'lesson_description'],
              language,
              supabase
            );

            return {
              ...lesson,
              lesson_title: translatedLesson.lesson_title || lesson.lesson_title,
              lesson_description: translatedLesson.lesson_description || lesson.lesson_description
            };
          })
        );


        const lessonsWithProgress = translatedLessons.map((lesson) => {
          let videoUrl = lesson.video_provider_id;

          if (
            lesson.video_provider === 'direct' &&
            videoUrl &&
            !videoUrl.startsWith('http')
          ) {
            if (!videoUrl.includes('/')) {
              videoUrl = `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoUrl}`;
            } else if (!videoUrl.startsWith('course-videos/')) {
              videoUrl = `${supabaseUrl}/storage/v1/object/public/${videoUrl}`;
            } else {
              videoUrl = `${supabaseUrl}/storage/v1/object/public/${videoUrl}`;
            }
          }

          const progress =
            progressMap.get(lesson.lesson_id) || ({} as { is_completed?: boolean; video_progress_percentage?: number });

          return {
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title,
            lesson_description: lesson.lesson_description,
            lesson_order_index: lesson.lesson_order_index,
            duration_seconds: lesson.duration_seconds,
            // Tiempo total: video + materiales + actividades (o calcular desde duration_seconds)
            total_duration_minutes: lesson.total_duration_minutes || Math.ceil((lesson.duration_seconds || 0) / 60),
            video_provider_id: videoUrl,
            video_provider: lesson.video_provider,
            is_completed: progress?.is_completed || false,
            progress_percentage: progress?.video_progress_percentage || 0,
            transcript_content: (lesson as any).transcript_content,
            summary_content: (lesson as any).summary_content,
          };
        });

        return {
          module_id: module.module_id,
          module_title: translatedModule.module_title || module.module_title,
          module_description: translatedModule.module_description || module.module_description,
          module_order_index: module.module_order_index,
          module_duration_minutes: module.module_duration_minutes,
          is_published: module.is_published,
          lessons: lessonsWithProgress,
        };
      })
    );

    const overallProgress = userEnrollment?.overall_progress_percentage
      ? Number(userEnrollment.overall_progress_percentage)
      : 0;

    const responseBody = {
      modules: modulesWithLessons,
      overall_progress_percentage: overallProgress,
    };

    return withCacheHeaders(
      NextResponse.json(responseBody),
      cacheHeaders.semiStatic
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
