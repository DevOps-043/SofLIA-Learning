import { NextRequest, NextResponse } from 'next/server';
import { responseCreateSchema, type ResponseCreateBody } from '@/app/api/courses/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

interface ResponseUserRow {
  id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
}

interface CourseQuestionResponseRow {
  id: string;
  question_id: string;
  course_id: string;
  user_id: string;
  content: string;
  parent_response_id: string | null;
  is_deleted: boolean | null;
  is_approved_answer?: boolean | null;
  is_instructor_answer?: boolean | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_data?: Record<string, unknown> | null;
  user: ResponseUserRow | null;
}

interface ResponseReactionCountRow {
  response_id: string | null;
}

interface ResponseUserReactionRow {
  response_id: string | null;
  reaction_type: string | null;
}

interface ResponseTreeNode extends CourseQuestionResponseRow {
  replies: ResponseTreeNode[];
  reaction_count: number;
  user_reaction: string | null;
}

/**
 * GET /api/courses/[slug]/questions/[questionId]/responses
 * Obtiene todas las respuestas de una pregunta con respuestas anidadas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { slug, questionId } = await params;
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

    // Verificar que la pregunta existe
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .select('id')
      .eq('id', questionId)
      .eq('course_id', course.id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // OPTIMIZACIÓN: Cargar todas las respuestas de una vez (incluyendo todas las anidadas)
    // Esto reduce de N queries a solo 1 query
    const { data: allResponses, error: responsesError } = await supabase
      .from('course_question_responses')
      .select(`
        *,
        user:users!course_question_responses_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('question_id', questionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .returns<CourseQuestionResponseRow[]>();

    // OPTIMIZACIÓN: Calcular contadores de reacciones Y reacciones del usuario en batch
    // Si hay respuestas, obtener los contadores de reacciones en una sola query
    let reactionCountsMap = new Map<string, number>();
    let userReactionsMap = new Map<string, string>();

    if (allResponses && allResponses.length > 0) {
      const responseIds = allResponses.map((response) => response.id);

      // Obtener usuario actual para cargar sus reacciones
      const user = await SessionService.getCurrentUser();

      // Query paralela: Contar reacciones y obtener reacciones del usuario
      const reactionsPromises = [
        supabase
          .from('course_question_reactions')
          .select('response_id')
          .in('response_id', responseIds)
          .returns<ResponseReactionCountRow[]>()
      ];

      // Si hay usuario, agregar query para sus reacciones
      if (user) {
        reactionsPromises.push(
          supabase
            .from('course_question_reactions')
            .select('response_id, reaction_type')
            .eq('user_id', user.id)
            .in('response_id', responseIds)
            .returns<ResponseUserReactionRow[]>()
        );
      }

      const [reactionCountsResult, userReactionsResult] = await Promise.all(reactionsPromises);

      // Procesar contadores de reacciones
      if (!reactionCountsResult.error && reactionCountsResult.data) {
        reactionCountsResult.data.forEach((reaction) => {
          const responseId = reaction.response_id;
          if (responseId) {
            reactionCountsMap.set(responseId, (reactionCountsMap.get(responseId) || 0) + 1);
          }
        });
      }

      // Procesar reacciones del usuario
      if (userReactionsResult && !userReactionsResult.error && userReactionsResult.data) {
        userReactionsResult.data.forEach((reaction) => {
          if (reaction.response_id && reaction.reaction_type) {
            userReactionsMap.set(reaction.response_id, reaction.reaction_type);
          }
        });
      }
    }

    if (responsesError) {
      return NextResponse.json(
        { error: 'Error al obtener respuestas' },
        { status: 500 }
      );
    }

    if (!allResponses || allResponses.length === 0) {
      return NextResponse.json([]);
    }

    // Estructurar el árbol de respuestas en memoria (mucho más rápido que múltiples queries)
    // Separar respuestas por nivel
    const responseMap = new Map<string, ResponseTreeNode>();
    const topLevelResponses: ResponseTreeNode[] = [];

    // Primero, indexar todas las respuestas por ID e incluir contadores de reacciones y reacción del usuario
    allResponses.forEach((response) => {
      const reactionCount = reactionCountsMap.get(response.id) || 0;
      const userReaction = userReactionsMap.get(response.id) || null;
      responseMap.set(response.id, {
        ...response,
        replies: [],
        reaction_count: reactionCount, // Añadir contador de reacciones
        user_reaction: userReaction    // Añadir reacción del usuario (si existe)
      });
    });

    // Luego, construir el árbol
    allResponses.forEach((response) => {
      const responseWithReplies = responseMap.get(response.id)!;
      
      if (!response.parent_response_id) {
        // Respuesta de nivel superior
        topLevelResponses.push(responseWithReplies);
      } else {
        // Respuesta anidada - encontrar el padre
        const parent = responseMap.get(response.parent_response_id);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(responseWithReplies);
        }
      }
    });

    // Ordenar respuestas de nivel superior
    topLevelResponses.sort((a, b) => {
      // Primero las respuestas aprobadas
      if (a.is_approved_answer && !b.is_approved_answer) return -1;
      if (!a.is_approved_answer && b.is_approved_answer) return 1;
      // Luego las del instructor
      if (a.is_instructor_answer && !b.is_instructor_answer) return -1;
      if (!a.is_instructor_answer && b.is_instructor_answer) return 1;
      // Finalmente por fecha
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // Ordenar respuestas anidadas (ya están ordenadas por created_at desde la query)
    const sortRepliesRecursively = (responses: ResponseTreeNode[]) => {
      responses.forEach((response) => {
        if (response.replies && response.replies.length > 0) {
          sortRepliesRecursively(response.replies);
        }
      });
    };
    sortRepliesRecursively(topLevelResponses);

    return NextResponse.json(topLevelResponses);
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
 * POST /api/courses/[slug]/questions/[questionId]/responses
 * Crea una nueva respuesta a una pregunta
 */
async function handlePost(
  _request: NextRequest,
  body: ResponseCreateBody,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { slug, questionId } = await params;
    const supabase = await createClient();

    // Obtener usuario actual
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado.', 401);
    }

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404);
    }

    // Verificar que la pregunta existe
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .select('id')
      .eq('id', questionId)
      .eq('course_id', course.id)
      .single();

    if (questionError || !question) {
      return apiError('QUESTION_NOT_FOUND', 'Pregunta no encontrada.', 404);
    }

    const { content, parent_response_id, attachment_url, attachment_type, attachment_data } = body;
    const sanitizedContent = sanitizeHtml(content, {
      level: 'rich',
      maxLength: 50_000,
    }).trim();

    if (!sanitizedContent) {
      return apiError('VALIDATION_ERROR', 'El contenido de la respuesta es requerido.', 422);
    }

    // Determinar si es respuesta de instructor
    const isInstructorAnswer = course.instructor_id === user.id;

    // Crear la respuesta
    const { data: response, error: responseError } = await supabase
      .from('course_question_responses')
      .insert({
        question_id: questionId,
        course_id: course.id,
        user_id: user.id,
        content: sanitizedContent,
        parent_response_id: parent_response_id || null,
        is_instructor_answer: isInstructorAnswer,
        attachment_url: attachment_url || null,
        attachment_type: attachment_type || null,
        attachment_data: attachment_data || {}
      })
      .select(`
        *,
        user:users!course_question_responses_user_id_fkey(
          id,
          username,
          display_name,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .single();

    if (responseError) {
      return apiError('RESPONSE_CREATE_FAILED', 'Error al crear respuesta.', 500);
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

export const POST = withZodBody(responseCreateSchema, handlePost);
