import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CourseService } from '@/features/courses/services/course.service';
import { SessionService } from '@/features/auth/services/session.service';
import { PurchasedCoursesService } from '@/features/courses/services/purchased-courses.service';
import { ContentTranslationService } from '@/core/services/contentTranslation.service';
import { SupportedLanguage } from '@/core/i18n/i18n';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';
import { formatApiError, logError } from '@/core/utils/api-errors';
import { fromLoose } from '@/lib/supabase/looseQuery';

/**
 * GET /api/courses/[slug]/full
 *
 * Endpoint UNIFICADO que retorna toda la información del curso en UNA sola llamada:
 * - Datos del curso (título, descripción, instructor, etc.)
 * - Estado de compra del usuario
 * - Módulos y lecciones con progreso
 * - Skills del curso
 *
 * OPTIMIZACIÓN: Reduce 4 llamadas API a 1, ejecutando consultas en paralelo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const language = (searchParams.get('lang') || 'es') as SupportedLanguage;

    const supabase = await createClient();

    // Obtener usuario actual (puede ser null si no está autenticado)
    const currentUser = await SessionService.getCurrentUser();
    const effectiveUserId = userId || currentUser?.id;

    // ========================================
    // FASE 1: Consultas paralelas principales
    // ========================================
    const [
      courseData,
      courseIdResult,
    ] = await Promise.all([
      // 1. Obtener datos del curso
      CourseService.getCourseBySlug(slug, effectiveUserId || undefined),
      // 2. Obtener ID del curso para otras consultas
      supabase.from('courses').select('id').eq('slug', slug).single(),
    ]);

    if (!courseData || courseIdResult.error || !courseIdResult.data) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const courseId = courseIdResult.data.id;

    // ========================================
    // FASE 2: Consultas paralelas dependientes del courseId
    // ========================================
    const [
      modulesResult,
      skillsResult,
      purchaseCheck,
      enrollmentResult,
      instructorResult,
    ] = await Promise.all([
      // 1. Obtener módulos
      supabase
        .from('course_modules')
        .select(`
          module_id,
          module_title,
          module_order_index,
          module_duration_minutes,
          is_published
        `)
        .eq('course_id', courseId)
        .order('module_order_index', { ascending: true }),

      // 2. Obtener skills
      fromLoose<CourseSkillRow>(supabase, 'course_skills')
        .select(`
          id,
          is_primary,
          is_required,
          proficiency_level,
          display_order,
          skills (
            skill_id,
            name,
            slug,
            description,
            category,
            icon_url,
            icon_type,
            icon_name,
            color,
            level
          )
        `)
        .eq('course_id', courseId)
        .order('display_order', { ascending: true })
        .limit(20),

      // 3. Verificar compra (solo si hay usuario)
      effectiveUserId
        ? PurchasedCoursesService.isCoursePurchased(effectiveUserId, courseId)
        : Promise.resolve(false),

      // 4. Obtener enrollment (solo si hay usuario)
      effectiveUserId
        ? supabase
            .from('user_course_enrollments')
            .select('enrollment_id, overall_progress_percentage')
            .eq('user_id', effectiveUserId)
            .eq('course_id', courseId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      courseData.instructor_id
        ? supabase
            .from('users')
            .select(`
              id,
              first_name,
              last_name,
              display_name,
              username,
              email,
              profile_picture_url,
              bio,
              linkedin_url,
              github_url,
              website_url,
              cargo_rol,
              type_rol,
              location
            `)
            .eq('id', courseData.instructor_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    // Procesar módulos
    const allModules: Array<{
      module_id: string
      module_title: string
      module_order_index: number
      module_duration_minutes?: number | null
      is_published?: boolean | null
    }> = modulesResult.data || [];
    const publishedModules = allModules.filter(module => module.is_published === true);
    const modules = publishedModules.length > 0 ? publishedModules : allModules;

    // ========================================
    // FASE 3: Obtener lecciones y progreso (si hay módulos)
    // ========================================
      let modulesWithLessons: Array<{
        module_id: string
        module_title: string
        module_order_index: number
        module_duration_minutes?: number | null
        is_published?: boolean | null
        lessons: Array<{
          lesson_id: string
          lesson_title: string
          lesson_description?: string | null
          lesson_order_index: number
          duration_seconds?: number | null
          total_duration_minutes: number
          video_provider_id?: string | null
          video_provider?: string | null
          is_completed: boolean
          progress_percentage: number
        }>
      }> = [];
    let overallProgress = 0;

    if (modules.length > 0) {
      const moduleIds = modules.map(module => module.module_id);
      const userEnrollment = enrollmentResult.data;

      // Consultas paralelas para lecciones y progreso
      const [lessonsResult, progressResult] = await Promise.all([
        // Lecciones
        supabase
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
            module_id
          `)
          .in('module_id', moduleIds)
          .order('lesson_order_index', { ascending: true }),

        // Progreso (solo si hay enrollment)
        userEnrollment?.enrollment_id
          ? supabase
              .from('user_lesson_progress')
              .select('lesson_id, is_completed, video_progress_percentage')
              .eq('enrollment_id', userEnrollment.enrollment_id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const allLessons: Array<{
        lesson_id: string
        lesson_title: string
        lesson_description?: string | null
        lesson_order_index: number
        duration_seconds?: number | null
        total_duration_minutes?: number | null
        video_provider_id?: string | null
        video_provider?: string | null
        is_published?: boolean | null
        module_id: string
      }> = lessonsResult.data || [];
      const progressData: Array<{
        lesson_id: string
        is_completed?: boolean | null
        video_progress_percentage?: number | null
      }> = progressResult.data || [];

      // Crear mapa de progreso
      const progressMap = new Map(
        progressData.map(progress => [progress.lesson_id, progress])
      );

      // Agrupar lecciones por módulo
      const lessonsByModule = new Map<string, typeof allLessons>();
      allLessons.forEach(lesson => {
        if (!lessonsByModule.has(lesson.module_id)) {
          lessonsByModule.set(lesson.module_id, []);
        }
        lessonsByModule.get(lesson.module_id)!.push(lesson);
      });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

      // Construir módulos con lecciones y progreso
      modulesWithLessons = modules.map(module => {
        const moduleLessons = lessonsByModule.get(module.module_id) || [];
        const publishedLessons = moduleLessons.filter(lesson => lesson.is_published === true);
        const lessons = publishedLessons.length > 0 ? publishedLessons : moduleLessons;

        const lessonsWithProgress = lessons.map(lesson => {
          let videoUrl = lesson.video_provider_id;

          // Construir URL de video si es necesario
          if (lesson.video_provider === 'direct' && videoUrl && !videoUrl.startsWith('http')) {
            videoUrl = `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoUrl}`;
          }

          const progress = progressMap.get(lesson.lesson_id);

          return {
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title,
            lesson_description: lesson.lesson_description,
            lesson_order_index: lesson.lesson_order_index,
            duration_seconds: lesson.duration_seconds,
            total_duration_minutes: lesson.total_duration_minutes || Math.ceil((lesson.duration_seconds || 0) / 60),
            video_provider_id: videoUrl,
            video_provider: lesson.video_provider,
            is_completed: progress?.is_completed || false,
            progress_percentage: progress?.video_progress_percentage || 0,
          };
        });

        return {
          module_id: module.module_id,
          module_title: module.module_title,
          module_order_index: module.module_order_index,
          module_duration_minutes: module.module_duration_minutes,
          is_published: module.is_published,
          lessons: lessonsWithProgress,
        };
      });

      overallProgress = userEnrollment?.overall_progress_percentage
        ? Number(userEnrollment.overall_progress_percentage)
        : 0;
    }

    // Procesar skills
    const skills = (skillsResult.data || []).map((cs) => ({
      id: cs.id,
      skill_id: cs.skills?.skill_id,
      name: cs.skills?.name,
      slug: cs.skills?.slug,
      description: cs.skills?.description,
      category: cs.skills?.category,
      icon_url: cs.skills?.icon_url,
      icon_type: cs.skills?.icon_type,
      icon_name: cs.skills?.icon_name,
      color: cs.skills?.color,
      level: cs.skills?.level,
      is_primary: cs.is_primary,
      is_required: cs.is_required,
      proficiency_level: cs.proficiency_level,
      display_order: cs.display_order,
    }));

    // Aplicar traducciones al curso si es necesario
    let translatedCourse = courseData;
    if (courseData.id && language !== 'es') {
      const fieldsToTranslate = ['title'];
      if (courseData.description) fieldsToTranslate.push('description');

      const translated = await ContentTranslationService.translateObject(
        'course',
        { ...courseData, id: courseData.id },
        fieldsToTranslate,
        language,
        supabase
      );

      if (translated.title) translatedCourse.title = translated.title;
      if (translated.description) translatedCourse.description = translated.description;
    }

    // ========================================
    // RESPUESTA UNIFICADA
    // ========================================
    const response = {
      // Datos del curso
      course: translatedCourse,

      // Estado de compra
      isPurchased: purchaseCheck,

      // Módulos con lecciones y progreso
      modules: modulesWithLessons,
      overall_progress_percentage: overallProgress,

      // Skills
      skills,

      // Instructor enriquecido
      instructor: instructorResult.data || null,
    };

    return withCacheHeaders(
      NextResponse.json(response),
      cacheHeaders.semiStatic
    );
  } catch (error) {
    logError('GET /api/courses/[slug]/full', error);
    return NextResponse.json(
      formatApiError(error, 'Error al obtener datos del curso'),
      { status: 500 }
    );
  }
}
    type CourseSkillRow = {
      id: string
      is_primary?: boolean | null
      is_required?: boolean | null
      proficiency_level?: string | null
      display_order?: number | null
      skills?: {
        skill_id?: string
        name?: string
        slug?: string
        description?: string
        category?: string
        icon_url?: string | null
        icon_type?: string | null
        icon_name?: string | null
        color?: string | null
        level?: string | null
      } | null
    }
