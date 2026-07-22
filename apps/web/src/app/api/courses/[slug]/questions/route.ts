import { NextRequest, NextResponse } from 'next/server';
import { questionCreateSchema, type QuestionCreateBody } from '@/app/api/courses/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';
import {
  applyQuestionsOrgScope,
  resolveQuestionsOrgScope,
} from '@/app/api/courses/_lib/question-org-scope';

interface CourseQuestionUserRow {
  id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
}

interface CourseQuestionRow {
  id: string;
  response_count?: number | null;
  user: CourseQuestionUserRow | null;
  [key: string]: unknown;
}

interface QuestionResponseCountRow {
  question_id: string;
}

interface QuestionUserReactionRow {
  question_id: string;
  reaction_type: string;
}

async function verifyLessonBelongsToCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  lessonId: string,
) {
  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, course_modules!inner(course_id)')
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single();

  return !error && Boolean(lesson);
}

/**
 * GET /api/courses/[slug]/questions
 * Obtiene las preguntas de un curso, opcionalmente filtradas por lección.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

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

    // Obtener parámetros de query para filtros
    const { searchParams } = new URL(request.url);
    const isResolved = searchParams.get('resolved');
    const isPinned = searchParams.get('pinned');
    const search = searchParams.get('search');
    const lessonId = searchParams.get('lessonId') || searchParams.get('lesson_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // La comunidad de preguntas es interna de cada organización: se resuelve el
    // alcance del usuario actual ANTES de consultar para no traer nunca filas
    // de otras empresas (ver `_lib/question-org-scope.ts`).
    const currentUser = await SessionService.getCurrentUser();
    const orgScope = await resolveQuestionsOrgScope(supabase, currentUser);

    // Construir query base
    let query = applyQuestionsOrgScope(
      supabase
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
        .eq('course_id', course.id)
        .eq('is_hidden', false),
      orgScope,
    )
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    // Aplicar filtros
    if (isResolved === 'true') {
      query = query.eq('is_resolved', true);
    } else if (isResolved === 'false') {
      query = query.eq('is_resolved', false);
    }

    if (isPinned === 'true') {
      query = query.eq('is_pinned', true);
    }

    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      return NextResponse.json(
        { error: 'Error al obtener preguntas' },
        { status: 500 }
      );
    }

    // OPTIMIZACIÓN CRÍTICA: Paralelizar todas las queries para reducir latencia
    if (questions && questions.length > 0) {
      const questionList = questions as CourseQuestionRow[];
      const questionIds = questionList.map((question) => question.id);

      // Solo conteos sin transferir datos
      const countPromises = questionIds.map((qid) =>
        supabase
          .from('course_question_responses')
          .select('*', { count: 'exact', head: true })
          .eq('question_id', qid)
          .eq('is_deleted', false)
      );

      // Si hay usuario, query de reacciones
      let userReactionsPromise: Promise<{ data: QuestionUserReactionRow[] | null; error: any }> | null = null;
      if (currentUser) {
        userReactionsPromise = supabase
          .from('course_question_reactions')
          .select('question_id, reaction_type')
          .eq('user_id', currentUser.id)
          .in('question_id', questionIds)
          .returns<QuestionUserReactionRow[]>();
      }

      // Ejecutar queries en paralelo
      const [countResults, userReactionsResult] = await Promise.all([
        Promise.all(countPromises),
        userReactionsPromise || Promise.resolve({ data: null, error: null })
      ]);

      // Crear un mapa de conteos: questionId -> count
      const countsMap = new Map<string, number>();
      countResults.forEach((res, index) => {
        if (!res.error) {
          countsMap.set(questionIds[index], res.count || 0);
        }
      });

      // Procesar reacciones del usuario
      let userReactionsMap = new Map<string, string>();
      if (userReactionsResult && userReactionsResult.data) {
        userReactionsResult.data.forEach((reaction) => {
          userReactionsMap.set(reaction.question_id, reaction.reaction_type);
        });
      }

      // Aplicar conteos y reacciones a las preguntas
      const questionsWithCounts = questionList.map((question) => ({
        ...question,
        response_count: countsMap.get(question.id) || question.response_count || 0,
        user_reaction: userReactionsMap.get(question.id) || null
      }));

      // ⚡ OPTIMIZACIÓN: Sin caché para datos en tiempo real (realtime subscriptions)
      // El caché causaba delays en mostrar nuevas preguntas/respuestas/reacciones
      return withCacheHeaders(
        NextResponse.json(questionsWithCounts || []),
        cacheHeaders.noCache
      );
    }

    // ⚡ OPTIMIZACIÓN: Sin caché para datos en tiempo real
    return withCacheHeaders(
      NextResponse.json(questions || []),
      cacheHeaders.noCache
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

/**
 * POST /api/courses/[slug]/questions
 * Crea una nueva pregunta en el curso
 */
async function handlePost(
  _request: NextRequest,
  body: QuestionCreateBody,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener usuario actual
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401);
    }

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404);
    }

    const { content, lesson_id, tags, attachment_url, attachment_type, attachment_data } = body;
    const sanitizedContent = sanitizeHtml(content, {
      level: 'rich',
      maxLength: 50_000,
    }).trim();

    if (!sanitizedContent) {
      return apiError('VALIDATION_ERROR', 'El contenido de la pregunta es requerido.', 422);
    }

    const lessonBelongsToCourse = await verifyLessonBelongsToCourse(
      supabase,
      course.id,
      lesson_id,
    );

    if (!lessonBelongsToCourse) {
      return apiError('LESSON_NOT_FOUND', 'Lección no encontrada para este curso.', 404);
    }

    // La pregunta se sella con la organización del autor: es la clave con la que
    // el resto de endpoints filtra la comunidad. Sin organización activa no hay
    // comunidad a la que publicar.
    const orgScope = await resolveQuestionsOrgScope(supabase, user);
    if (!orgScope.organizationId) {
      return apiError(
        'ORGANIZATION_REQUIRED',
        'Necesitas pertenecer a una organización para publicar preguntas.',
        403,
      );
    }

    // Crear la pregunta
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .insert({
        course_id: course.id,
        organization_id: orgScope.organizationId,
        lesson_id,
        user_id: user.id,
        content: sanitizedContent,
        tags: tags || [],
        attachment_url: attachment_url || null,
        attachment_type: attachment_type || null,
        attachment_data: attachment_data || {}
      })
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
      .single();

    if (questionError) {
      return apiError('QUESTION_CREATE_FAILED', 'Error al crear pregunta.', 500);
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

export const POST = withZodBody(questionCreateSchema, handlePost);
