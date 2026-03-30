import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * PUT /api/courses/[slug]/questions/[questionId]/responses/[responseId]
 * Actualiza una respuesta
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string; responseId: string }> }
) {
  try {
    const { slug, questionId, responseId } = await params;
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
      .select('id, instructor_id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la respuesta existe
    const { data: response, error: responseError } = await supabase
      .from('course_question_responses')
      .select('user_id, question_id, course_id')
      .eq('id', responseId)
      .eq('question_id', questionId)
      .eq('course_id', course.id)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo el autor o instructor pueden editar
    const isInstructor = course.instructor_id === user.id;
    const isAuthor = response.user_id === user.id;

    if (!isAuthor && !isInstructor) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta respuesta' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { content, is_approved_answer } = body;

    // Preparar datos de actualización
    const updateData: any = {};
    if (content !== undefined) updateData.content = content.trim();
    // Solo el autor de la pregunta puede aprobar respuestas
    if (is_approved_answer !== undefined) {
      const { data: question } = await supabase
        .from('course_questions')
        .select('user_id')
        .eq('id', questionId)
        .single();

      if (question?.user_id === user.id) {
        // Si se aprueba esta respuesta, desaprobar las demás
        if (is_approved_answer) {
          await supabase
            .from('course_question_responses')
            .update({ is_approved_answer: false })
            .eq('question_id', questionId)
            .neq('id', responseId);
        }
        updateData.is_approved_answer = is_approved_answer;
        // Marcar la pregunta como resuelta si se aprueba una respuesta
        if (is_approved_answer) {
          await supabase
            .from('course_questions')
            .update({ is_resolved: true })
            .eq('id', questionId);
        }
      }
    }
    updateData.is_edited = true;
    updateData.edited_at = new Date().toISOString();

    // Actualizar la respuesta
    const { data: updatedResponse, error: updateError } = await supabase
      .from('course_question_responses')
      .update(updateData)
      .eq('id', responseId)
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

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar respuesta' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedResponse);
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
 * DELETE /api/courses/[slug]/questions/[questionId]/responses/[responseId]
 * Elimina una respuesta (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string; responseId: string }> }
) {
  try {
    const { slug, questionId, responseId } = await params;
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
      .select('id, instructor_id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la respuesta existe
    const { data: response, error: responseError } = await supabase
      .from('course_question_responses')
      .select('user_id, question_id, course_id')
      .eq('id', responseId)
      .eq('question_id', questionId)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo el autor o instructor pueden eliminar
    const isInstructor = course.instructor_id === user.id;
    const isAuthor = response.user_id === user.id;

    if (!isAuthor && !isInstructor) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta respuesta' },
        { status: 403 }
      );
    }

    // Soft delete: marcar como eliminada
    const { error: deleteError } = await supabase
      .from('course_question_responses')
      .update({ is_deleted: true })
      .eq('id', responseId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Error al eliminar respuesta' },
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

