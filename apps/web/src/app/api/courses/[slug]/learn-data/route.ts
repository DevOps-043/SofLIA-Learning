import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers'
import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import { SupportedLanguage } from '@/core/i18n/i18n'

/**
 * ⚡ ENDPOINT UNIFICADO DE OPTIMIZACIÓN
 *
 * GET /api/courses/[slug]/learn-data?lessonId=[lessonId]
 *
 * Consolida 8 endpoints separados en UN SOLO REQUEST:
 * 1. /api/courses/[slug] - Datos del curso
 * 2. /api/courses/[slug]/modules - Módulos y lecciones
 * 3. /api/courses/[slug]/lessons/[lessonId]/transcript - Transcripción
 * 4. /api/courses/[slug]/lessons/[lessonId]/summary - Resumen
 * 5. /api/courses/[slug]/lessons/[lessonId]/activities - Actividades
 * 6. /api/courses/[slug]/lessons/[lessonId]/materials - Materiales
 * 7. /api/courses/[slug]/questions - Preguntas del curso
 * 8. /api/courses/[slug]/notes/stats - Estadísticas de notas
 *
 * BENEFICIOS:
 * - Reduce 8 HTTP requests a 1 (~40-50% mejora)
 * - Valida el curso UNA SOLA VEZ (no 8 veces)
 * - Ejecuta todas las queries en PARALELO en el servidor
 * - Reduce overhead de HTTP (headers, cookies, etc.)
 * - Aprovecha connection pooling de manera óptima
 *
 * RESPONSE FORMAT:
 * {
 *   course: { id, title, description, ... },
 *   modules: [{ module_id, lessons: [...] }],
 *   currentLesson: {
 *     transcript: "...",
 *     summary: "...",
 *     activities: [...],
 *     materials: [...]
 *   },
 *   questions: [...],
 *   notesStats: { totalNotes, lessonsWithNotes, lastUpdate }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()

  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const language = searchParams.get('language') || 'es' // Por defecto español

    const supabase = await createClient()

    // ⚡ OPTIMIZACIÓN 1: Validar curso UNA SOLA VEZ (no 8 veces)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const courseId = course.id

    // ⚡ OPTIMIZACIÓN 2: Obtener usuario UNA SOLA VEZ
    const currentUser = await SessionService.getCurrentUser()

    // ⚡ OPTIMIZACIÓN 3: Ejecutar TODAS las queries en PARALELO
    const [
      modulesResult,
      questionsResult,
      notesStatsResult,
      lessonDataResult
    ] = await Promise.all([
      // Query 1: Módulos y lecciones con progreso
      loadModulesWithProgress(supabase, courseId, currentUser?.id, language),

      // Query 2: Preguntas del curso
      loadCourseQuestions(supabase, courseId, currentUser?.id),

      // Query 3: Estadísticas de notas (solo si hay usuario)
      currentUser
        ? loadNotesStats(supabase, courseId, currentUser.id)
        : Promise.resolve(null),

      // Query 4: Datos de lección actual (solo si se especificó lessonId)
      lessonId
        ? loadLessonData(supabase, courseId, lessonId, language)
        : Promise.resolve(null)
    ])

    const endTime = Date.now()
    const totalTime = endTime - startTime

    if (process.env.NODE_ENV === 'development') {
      }

    // Construir response unificada
    const response = {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail_url,
        instructor_id: course.instructor_id,
        category: course.category,
        difficulty_level: course.difficulty_level,
        price: course.price,
        is_published: course.is_published
      },
      modules: modulesResult.modules,
      courseProgress: modulesResult.progress,
      lastWatchedLessonId: modulesResult.lastWatchedLessonId,
      currentLesson: lessonDataResult,
      questions: questionsResult,
      notesStats: notesStatsResult || {
        totalNotes: 0,
        lessonsWithNotes: '0/0',
        lastUpdate: null
      },
      _meta: {
        timestamp: new Date().toISOString(),
        executionTime: `${totalTime}ms`,
        queriesExecuted: 4,
        optimization: 'unified-endpoint'
      }
    }

    // ⚡ OPTIMIZACIÓN 4: Cache inteligente (semi-estático para módulos, dinámico para progreso)
    return withCacheHeaders(
      NextResponse.json(response),
      cacheHeaders.dynamic // 30 segundos (contiene datos de progreso del usuario)
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * Obtiene el nombre de la tabla de lecciones según el idioma
 */
function getLessonsTableName(language: string): string {
  switch (language) {
    case 'en':
      return 'course_lessons_en'
    case 'pt':
      return 'course_lessons_pt'
    case 'es':
    default:
      return 'course_lessons'
  }
}

/**
 * Normaliza el nombre de un campo de lección a su nombre estándar
 * Las tablas *_en y *_pt usan nombres sin prefijo de idioma
 */
function normalizeLessonFieldName(fieldName: string, language: string): string {
  // Para tablas traducidas, los campos se llaman igual que en español
  // No hay sufijos _en o _pt en las tablas course_lessons_en/pt
  return fieldName;
}

/**
 * Carga módulos y lecciones con progreso del usuario
 */
async function loadModulesWithProgress(
  supabase: any,
  courseId: string,
  userId?: string,
  language: string = 'es'
) {
  // Obtener TODOS los módulos del curso (sin filtrar por is_published)
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
    .order('module_order_index', { ascending: true })

  if (allModulesError || !allModules) {
    return { modules: [], progress: 0 }
  }

  // Filtrar solo los publicados si hay alguno publicado, sino mostrar todos
  // (misma lógica que en /api/courses/[slug]/modules)
  const publishedModules = (allModules || []).filter(m => m.is_published === true)
  const modules = publishedModules.length > 0 ? publishedModules : (allModules || [])

  if (modules.length === 0) {
    return { modules: [], progress: 0 }
  }

  // Obtener enrollment del usuario
  let userEnrollment = null
  if (userId) {
    const { data: enrollment } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()
    userEnrollment = enrollment
  }

  // IMPORTANTE: Usar la tabla de lecciones según el idioma
  // course_lessons (español), course_lessons_en (inglés), course_lessons_pt (portugués)
  const lessonsTableName = getLessonsTableName(language);
  const { data: allLessonsData, error: lessonsError } = await supabase
    .from(lessonsTableName)
    .select(`
      lesson_id,
      lesson_title,
      lesson_description,
      lesson_order_index,
      duration_seconds,
      video_provider_id,
      video_provider,
      is_published,
      module_id,
      transcript_content,
      summary_content
    `)
    .in('module_id', modules.map((m: any) => m.module_id))
    .order('lesson_order_index', { ascending: true })

  if (lessonsError) {
    console.error('[learn-data/route] Error obteniendo lecciones:', lessonsError);
  }

  // Obtener progreso del usuario
  let progressMap = new Map()
  let lastWatchedLessonId: string | null = null
  if (userEnrollment && allLessonsData && allLessonsData.length > 0) {
    // ⚡ OPTIMIZACIÓN: Query optimizada para obtener progreso y último video visto en una sola consulta
    const { data: progressData } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed, lesson_status, video_progress_percentage, last_accessed_at, started_at')
      .eq('enrollment_id', userEnrollment.enrollment_id)
      .in('lesson_id', allLessonsData.map((l: any) => l.lesson_id))
      .order('last_accessed_at', { ascending: false, nullsFirst: false })

    progressMap = new Map(
      (progressData || []).map((p: any) => [p.lesson_id, p])
    )

    // 🎯 OPTIMIZACIÓN MEJORADA: Encontrar la última lección VÁLIDA respetando el orden secuencial
    if (progressData && progressData.length > 0 && allLessonsData && allLessonsData.length > 0) {
      // Paso 1: Crear un mapa de progreso para búsqueda rápida
      const progressLookup = new Map(progressData.map((p: any) => [p.lesson_id, p]));

      // Paso 2: Ordenar TODAS las lecciones por módulo y orden dentro del módulo
      const orderedLessons = [...allLessonsData].sort((a: any, b: any) => {
        // Primero ordenar por módulo
        const moduleA = modules.find((m: any) => m.module_id === a.module_id);
        const moduleB = modules.find((m: any) => m.module_id === b.module_id);

        if (moduleA && moduleB && moduleA.module_order_index !== moduleB.module_order_index) {
          return moduleA.module_order_index - moduleB.module_order_index;
        }

        // Luego ordenar por orden de lección dentro del módulo
        return a.lesson_order_index - b.lesson_order_index;
      });

      // Paso 3: Encontrar la lección correcta siguiendo el orden secuencial
      let lastValidLessonId: string | null = null;
      let lastAccessedInProgress: { lesson_id: string; accessed_at: number } | null = null;

      for (let i = 0; i < orderedLessons.length; i++) {
        const lesson = orderedLessons[i];
        const progress = progressLookup.get(lesson.lesson_id);

        // Si no hay progreso para esta lección, es donde debe empezar
        if (!progress) {
          // Si no hemos encontrado ninguna en progreso, esta es la primera sin iniciar
          if (!lastValidLessonId) {
            lastValidLessonId = lesson.lesson_id;
          }
          break; // No seguir buscando después de la primera sin progreso
        }

        // Si la lección está completada, continuar a la siguiente
        if (progress.is_completed) {
          lastValidLessonId = lesson.lesson_id; // Guardar como candidata
          continue;
        }

        // Si la lección está en progreso (iniciada pero no completada)
        if (progress.video_progress_percentage > 0 || progress.lesson_status === 'in_progress') {
          const accessTime = progress.last_accessed_at
            ? new Date(progress.last_accessed_at).getTime()
            : (progress.started_at ? new Date(progress.started_at).getTime() : 0);

          // Guardar la más recientemente accedida entre las lecciones en progreso
          if (!lastAccessedInProgress || accessTime > lastAccessedInProgress.accessed_at) {
            lastAccessedInProgress = {
              lesson_id: lesson.lesson_id,
              accessed_at: accessTime
            };
          }

          lastValidLessonId = lesson.lesson_id;
        }

        // Si encontramos una lección bloqueada o no iniciada, detenerse
        if (progress.lesson_status === 'locked' || progress.lesson_status === 'not_started') {
          break;
        }
      }

      // Paso 4: Priorizar la lección en progreso más reciente, o la última válida
      if (lastAccessedInProgress) {
        lastWatchedLessonId = lastAccessedInProgress.lesson_id;
      } else if (lastValidLessonId) {
        lastWatchedLessonId = lastValidLessonId;
      } else {
        // Fallback: primera lección del curso
        lastWatchedLessonId = orderedLessons[0]?.lesson_id || null;
      }
    }
  }

  // Agrupar lecciones por módulo
  const lessonsByModule = new Map<string, any[]>()
  ;(allLessonsData || []).forEach((lesson: any) => {
    if (!lessonsByModule.has(lesson.module_id)) {
      lessonsByModule.set(lesson.module_id, [])
    }
    lessonsByModule.get(lesson.module_id)!.push(lesson)
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''


  // Construir módulos con lecciones (ya vienen traducidas de la tabla correcta)
  const modulesWithLessons = await Promise.all(
    modules.map(async (module: any) => {
      // Traducir módulo usando ContentTranslationService
      const moduleWithId = { ...module, id: module.module_id };
      const translatedModule = await ContentTranslationService.translateObject(
        'module',
        moduleWithId,
        ['module_title', 'module_description'],
        language as SupportedLanguage,
        supabase
      );

      const moduleLessons = lessonsByModule.get(module.module_id) || []

      // Filtrar solo las lecciones publicadas si hay alguna publicada, sino mostrar todas
      // (misma lógica que en /api/courses/[slug]/modules)
      const publishedLessons = moduleLessons.filter(
        (lesson: any) => lesson.is_published === true
      )
      const lessonsToShow = publishedLessons.length > 0 ? publishedLessons : moduleLessons

      // Las lecciones ya vienen traducidas de la tabla específica del idioma

      const lessonsWithProgress = lessonsToShow.map((lesson: any) => {
        // Reconstruir URL de video
        let videoUrl = lesson.video_provider_id
        if (lesson.video_provider === 'direct' && videoUrl && !videoUrl.startsWith('http')) {
          if (supabaseUrl) {
            videoUrl = videoUrl.includes('/')
              ? `${supabaseUrl}/storage/v1/object/public/${videoUrl}`
              : `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoUrl}`
          }
        }

        const progress = progressMap.get(lesson.lesson_id)

        return {
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          lesson_description: lesson.lesson_description,
          lesson_order_index: lesson.lesson_order_index,
          duration_seconds: lesson.duration_seconds,
          video_provider_id: videoUrl,
          video_provider: lesson.video_provider,
          is_completed: progress?.is_completed || false,
          progress_percentage: progress?.video_progress_percentage || 0,
          transcript_content: lesson.transcript_content || null,
          summary_content: lesson.summary_content || null
        }
      })

      return {
        module_id: module.module_id,
        module_title: translatedModule.module_title || module.module_title,
        module_description: translatedModule.module_description || module.module_description,
        module_order_index: module.module_order_index,
        lessons: lessonsWithProgress
      }
    })
  )

  // Calcular progreso general
  const allLessons = modulesWithLessons.flatMap((m: any) => m.lessons)
  const completedLessons = allLessons.filter((l: any) => l.is_completed)
  const totalProgress = allLessons.length > 0
    ? Math.round((completedLessons.length / allLessons.length) * 100)
    : 0

  return {
    modules: modulesWithLessons,
    progress: totalProgress,
    lastWatchedLessonId
  }
}

/**
 * Carga datos de una lección específica (transcript, summary, activities, materials)
 */
async function loadLessonData(
  supabase: any,
  courseId: string,
  lessonId: string,
  language: string = 'es'
) {
  // IMPORTANTE: Usar la tabla de lecciones según el idioma
  // course_lessons (español), course_lessons_en (inglés), course_lessons_pt (portugués)
  const lessonsTableName = getLessonsTableName(language);

  // Validar que la lección pertenece al curso
  const { data: lesson, error: lessonError } = await supabase
    .from(lessonsTableName)
    .select(`
      lesson_id,
      module_id,
      transcript_content,
      summary_content,
      course_modules!inner (
        module_id,
        course_id
      )
    `)
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single()

  if (lessonError || !lesson) {
    return null
  }

  // Obtener activities y materials en paralelo
  const [activitiesResult, materialsResult] = await Promise.all([
    supabase
      .from('lesson_activities')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('activity_order_index', { ascending: true }),

    supabase
      .from('lesson_materials')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('material_order_index', { ascending: true })
  ])

  return {
    lesson_id: lesson.lesson_id,
    transcript: lesson.transcript_content || null,
    summary: lesson.summary_content || null,
    activities: activitiesResult.data || [],
    materials: materialsResult.data || []
  }
}

/**
 * Carga preguntas del curso con conteos de respuestas
 */
async function loadCourseQuestions(
  supabase: any,
  courseId: string,
  userId?: string
) {
  const { data: questions, error: questionsError } = await supabase
    .from('course_questions')
    .select(`
      *,
      user:users!course_questions_user_id_fkey(
        id,
        username,
        display_name,
        first_name,
        last_name,
        profile_picture_url
      )
    `)
    .eq('course_id', courseId)
    .eq('is_hidden', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (questionsError || !questions || questions.length === 0) {
    return []
  }

  const questionIds = questions.map((q: any) => q.id)

  // Obtener conteos de respuestas y reacciones en paralelo
  const queries = [
    supabase
      .from('course_question_responses')
      .select('question_id')
      .in('question_id', questionIds)
      .eq('is_deleted', false)
  ]

  if (userId) {
    queries.push(
      supabase
        .from('course_question_reactions')
        .select('question_id, reaction_type')
        .eq('user_id', userId)
        .in('question_id', questionIds)
    )
  }

  const results = await Promise.all(queries)
  const responseCountsResult = results[0]
  const userReactionsResult = userId ? results[1] : null

  // Crear mapa de conteos
  const countsMap = new Map<string, number>()
  if (responseCountsResult.data) {
    responseCountsResult.data.forEach((response: any) => {
      const questionId = response.question_id
      countsMap.set(questionId, (countsMap.get(questionId) || 0) + 1)
    })
  }

  // Procesar reacciones
  let userReactionsMap = new Map<string, string>()
  if (userReactionsResult && userReactionsResult.data) {
    userReactionsResult.data.forEach((reaction: any) => {
      userReactionsMap.set(reaction.question_id, reaction.reaction_type)
    })
  }

  // Aplicar conteos a preguntas
  return questions.map((question: any) => ({
    ...question,
    response_count: countsMap.get(question.id) || 0,
    user_reaction: userReactionsMap.get(question.id) || null
  }))
}

/**
 * Carga estadísticas de notas del usuario
 */
async function loadNotesStats(
  supabase: any,
  courseId: string,
  userId: string
) {
  // Esta implementación depende del servicio NoteService
  // Por ahora retornamos estructura básica
  // TODO: Implementar query directa para evitar dependencia de servicio

  const { data: enrollment } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) {
    return {
      totalNotes: 0,
      lessonsWithNotes: '0/0',
      lastUpdate: null
    }
  }

  const { data: notes } = await supabase
    .from('lesson_notes')
    .select('note_id, lesson_id, updated_at')
    .eq('enrollment_id', enrollment.enrollment_id)
    .order('updated_at', { ascending: false })

  const totalNotes = notes?.length || 0
  const uniqueLessons = new Set(notes?.map((n: any) => n.lesson_id) || [])
  const lastUpdate = notes && notes.length > 0 ? notes[0].updated_at : null

  // Obtener total de lecciones del curso
  // Primero obtener los module_ids del curso
  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)

  const moduleIds = modules?.map((m: any) => m.module_id) || []

  // Luego contar las lecciones de esos módulos
  // Si no hay módulos, el total es 0
  let totalLessons = 0
  if (moduleIds.length > 0) {
    const { count } = await supabase
      .from('course_lessons')
      .select('lesson_id', { count: 'exact', head: true })
      .in('module_id', moduleIds)
    totalLessons = count || 0
  }

  return {
    totalNotes,
    lessonsWithNotes: `${uniqueLessons.size}/${totalLessons || 0}`,
    lastUpdate
  }
}
