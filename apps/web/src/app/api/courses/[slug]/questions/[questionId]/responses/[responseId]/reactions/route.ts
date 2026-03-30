import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/courses/[slug]/questions/[questionId]/responses/[responseId]/reactions
 * Crea o elimina una reacción a una respuesta
 */
export async function POST(
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
      .select('id')
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
      .select('id')
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

    // Obtener datos del body
    const body = await request.json();
    const { reaction_type, action = 'toggle' } = body;

    if (!reaction_type || !['like', 'helpful', 'love', 'laugh', 'thanks'].includes(reaction_type)) {
      return NextResponse.json(
        { error: 'Tipo de reacción inválido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe la reacción
    const { data: existingReaction, error: checkError } = await supabase
      .from('course_question_reactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('response_id', responseId)
      .eq('reaction_type', reaction_type)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: 'Error al verificar reacción' },
        { status: 500 }
      );
    }

    if (existingReaction) {
      // Si la acción es toggle y ya existe, eliminar la reacción
      if (action === 'toggle') {
        const { error: deleteError } = await supabase
          .from('course_question_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          return NextResponse.json(
            { error: 'Error al eliminar reacción' },
            { status: 500 }
          );
        }

        // Obtener el nuevo contador de reacciones después de eliminar
        const { data: reactionCount } = await supabase
          .from('course_question_reactions')
          .select('id', { count: 'exact' })
          .eq('response_id', responseId);

        return NextResponse.json({
          action: 'removed',
          reaction_type,
          new_count: reactionCount?.length || 0,
          user_reaction: null
        });
      } else {
        // Obtener contador actual
        const { data: reactionCount } = await supabase
          .from('course_question_reactions')
          .select('id', { count: 'exact' })
          .eq('response_id', responseId);

        return NextResponse.json({
          action: 'exists',
          reaction_type,
          new_count: reactionCount?.length || 0,
          user_reaction: reaction_type
        });
      }
    } else {
      // Crear la reacción
      const { data: reaction, error: insertError } = await supabase
        .from('course_question_reactions')
        .insert({
          user_id: user.id,
          response_id: responseId,
          reaction_type
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: 'Error al crear reacción' },
          { status: 500 }
        );
      }

      // Obtener el nuevo contador de reacciones después de agregar
      const { data: reactionCount } = await supabase
        .from('course_question_reactions')
        .select('id', { count: 'exact' })
        .eq('response_id', responseId);

      return NextResponse.json({
        action: 'added',
        reaction: reaction,
        new_count: reactionCount?.length || 0,
        user_reaction: reaction_type
      });
    }
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

