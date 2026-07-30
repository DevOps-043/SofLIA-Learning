import { NextRequest, NextResponse } from 'next/server';
import { questionUpdateSchema, type QuestionUpdateBody } from '@/app/api/courses/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import {
  isQuestionInOrgScope,
  resolveQuestionsOrgScope,
} from '@/app/api/courses/_lib/question-org-scope';

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
 * GET /api/courses/[slug]/questions/[questionId]
 * Obtiene una pregunta específica con sus respuestas (opcional con include=responses)
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

    // Obtener la pregunta
    const { data: question, error: questionError } = await supabase
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
      .eq('id', questionId)
      .eq('course_id', course.id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Límite organizacional: una pregunta de otra empresa no existe para este
    // usuario (404 en lugar de 403 para no revelar su existencia).
    const currentUser = await SessionService.getCurrentUser();
    const orgScope = await resolveQuestionsOrgScope(supabase, currentUser, course.id);
    if (!isQuestionInOrgScope(question, orgScope)) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Incrementar contador de visualizaciones de forma atómica en background (fire-and-forget)
    void (async () => {
      try {
        const { error: rpcError } = await supabase.rpc('increment_question_view_count', {
          target_question_id: questionId,
        });
        if (rpcError) {
          // Fallback en caso de que no exista el RPC
          await supabase
            .from('course_questions')
            .update({ view_count: (question.view_count || 0) + 1 })
            .eq('id', questionId);
        }
      } catch (err) {
        console.error('Error incrementing view count:', err);
      }
    })();

    const updatedQuestion = {
      ...question,
      view_count: (question.view_count || 0) + 1
    };

    // Verificar si se solicitan las respuestas
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include');

    let responses: ResponseTreeNode[] = [];
    if (include === 'responses') {
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

      if (!responsesError && allResponses && allResponses.length > 0) {
        const responseIds = allResponses.map((r) => r.id);

        // Solo conteos sin transferir datos
        const reactionCountPromises = responseIds.map((rid) =>
          supabase
            .from('course_question_reactions')
            .select('*', { count: 'exact', head: true })
            .eq('response_id', rid)
        );

        // Si hay usuario, query para sus reacciones
        let userReactionsPromise: Promise<{ data: ResponseUserReactionRow[] | null; error: any }> | null = null;
        if (currentUser) {
          userReactionsPromise = supabase
            .from('course_question_reactions')
            .select('response_id, reaction_type')
            .eq('user_id', currentUser.id)
            .in('response_id', responseIds)
            .returns<ResponseUserReactionRow[]>();
        }

        // Ejecutar queries en paralelo
        const [reactionCountsResult, userReactionsResult] = await Promise.all([
          Promise.all(reactionCountPromises),
          userReactionsPromise || Promise.resolve({ data: null, error: null })
        ]);

        const reactionCountsMap = new Map<string, number>();
        reactionCountsResult.forEach((res, index) => {
          if (!res.error) {
            reactionCountsMap.set(responseIds[index], res.count || 0);
          }
        });

        // Procesar reacciones del usuario
        const userReactionsMap = new Map<string, string>();
        if (userReactionsResult && !userReactionsResult.error && userReactionsResult.data) {
          userReactionsResult.data.forEach((reaction) => {
            if (reaction.response_id && reaction.reaction_type) {
              userReactionsMap.set(reaction.response_id, reaction.reaction_type);
            }
          });
        }

        // Estructurar el árbol de respuestas
        const responseMap = new Map<string, ResponseTreeNode>();
        const topLevelResponses: ResponseTreeNode[] = [];

        allResponses.forEach((response) => {
          const reactionCount = reactionCountsMap.get(response.id) || 0;
          const userReaction = userReactionsMap.get(response.id) || null;
          responseMap.set(response.id, {
            ...response,
            replies: [],
            reaction_count: reactionCount,
            user_reaction: userReaction
          });
        });

        allResponses.forEach((response) => {
          const responseWithReplies = responseMap.get(response.id)!;
          if (!response.parent_response_id) {
            topLevelResponses.push(responseWithReplies);
          } else {
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
          if (a.is_approved_answer && !b.is_approved_answer) return -1;
          if (!a.is_approved_answer && b.is_approved_answer) return 1;
          if (a.is_instructor_answer && !b.is_instructor_answer) return -1;
          if (!a.is_instructor_answer && b.is_instructor_answer) return 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        // Ordenar respuestas anidadas recursivamente
        const sortRepliesRecursively = (responsesList: ResponseTreeNode[]) => {
          responsesList.forEach((r) => {
            if (r.replies && r.replies.length > 0) {
              sortRepliesRecursively(r.replies);
            }
          });
        };
        sortRepliesRecursively(topLevelResponses);

        responses = topLevelResponses;
      }
    }

    if (include === 'responses') {
      return NextResponse.json({
        question: updatedQuestion,
        responses
      });
    }

    return NextResponse.json(updatedQuestion);
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
 * PUT /api/courses/[slug]/questions/[questionId]
 * Actualiza una pregunta
 */
async function handlePut(
  _request: NextRequest,
  body: QuestionUpdateBody,
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
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado.', 404);
    }

    // Verificar que la pregunta existe y pertenece al usuario o es instructor
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .select('user_id, course_id, organization_id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return apiError('QUESTION_NOT_FOUND', 'Pregunta no encontrada.', 404);
    }

    const orgScope = await resolveQuestionsOrgScope(supabase, user, course.id);
    if (!isQuestionInOrgScope(question, orgScope)) {
      return apiError('QUESTION_NOT_FOUND', 'Pregunta no encontrada.', 404);
    }

    // Verificar permisos: solo el autor o instructor pueden editar
    const { data: courseData } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', question.course_id)
      .single();

    const isInstructor = courseData?.instructor_id === user.id;
    const isAuthor = question.user_id === user.id;

    if (!isAuthor && !isInstructor) {
      return apiError(
        'QUESTION_EDIT_FORBIDDEN',
        'No tienes permisos para editar esta pregunta.',
        403,
      );
    }

    const { content, tags, is_pinned, is_resolved } = body;

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    if (content !== undefined) {
      const sanitizedContent = sanitizeHtml(content, {
        level: 'rich',
        maxLength: 50_000,
      }).trim();
      if (!sanitizedContent) {
        return apiError('VALIDATION_ERROR', 'El contenido de la pregunta es requerido.', 422);
      }
      updateData.content = sanitizedContent;
    }
    if (tags !== undefined) updateData.tags = tags || [];
    if (is_pinned !== undefined && isInstructor) updateData.is_pinned = is_pinned;
    if (is_resolved !== undefined && isAuthor) updateData.is_resolved = is_resolved;
    updateData.is_edited = true;
    updateData.edited_at = new Date().toISOString();

    // Actualizar la pregunta
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('course_questions')
      .update(updateData)
      .eq('id', questionId)
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

    if (updateError) {
      return apiError('QUESTION_UPDATE_FAILED', 'Error al actualizar pregunta.', 500);
    }

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500, {
      details: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}

export const PUT = withZodBody(questionUpdateSchema, handlePut);

/**
 * DELETE /api/courses/[slug]/questions/[questionId]
 * Elimina una pregunta (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { slug, questionId } = await params;
    const supabase = await createClient();

    // Obtener usuario actual
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
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

    // Verificar que la pregunta existe
    const { data: question, error: questionError } = await supabase
      .from('course_questions')
      .select('user_id, course_id, organization_id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    const orgScope = await resolveQuestionsOrgScope(supabase, user, course.id);
    if (!isQuestionInOrgScope(question, orgScope)) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo el autor o instructor pueden eliminar
    const { data: courseData } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', question.course_id)
      .single();

    const isInstructor = courseData?.instructor_id === user.id;
    const isAuthor = question.user_id === user.id;

    if (!isAuthor && !isInstructor) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta pregunta' },
        { status: 403 }
      );
    }

    // Soft delete: marcar como oculta
    const { error: deleteError } = await supabase
      .from('course_questions')
      .update({ is_hidden: true })
      .eq('id', questionId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Error al eliminar pregunta' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
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
