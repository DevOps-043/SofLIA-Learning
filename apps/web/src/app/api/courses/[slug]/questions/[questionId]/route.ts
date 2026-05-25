import { NextRequest, NextResponse } from 'next/server';
import { questionUpdateSchema, type QuestionUpdateBody } from '@/app/api/courses/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/courses/[slug]/questions/[questionId]
 * Obtiene una pregunta específica con sus respuestas
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

    // Incrementar contador de visualizaciones
    await supabase
      .from('course_questions')
      .update({ view_count: (question.view_count || 0) + 1 })
      .eq('id', questionId);

    return NextResponse.json({ ...question, view_count: (question.view_count || 0) + 1 });
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
      .select('user_id, course_id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
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

    const { title, content, tags, is_pinned, is_resolved } = body;

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title?.trim() || null;
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
      .select('user_id, course_id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
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
