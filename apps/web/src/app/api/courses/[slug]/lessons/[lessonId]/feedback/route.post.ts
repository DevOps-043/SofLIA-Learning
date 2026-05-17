import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { SessionService } from '@/features/auth/services/session.service';

const VALID_FEEDBACK = ['like', 'dislike'] as const;

type FeedbackType = (typeof VALID_FEEDBACK)[number];

async function getCourseBySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string
) {
  return supabase.from('courses').select('id').eq('slug', slug).single();
}

async function validateLesson(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lessonId: string,
  courseId: string
) {
  return supabase
    .from('course_lessons')
    .select(`
      lesson_id,
      module_id,
      course_modules!inner (
        course_id
      )
    `)
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .single();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;

    const supabase = await createClient();

    const user = await SessionService.getCurrentUser();
    if (!user) {

      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courseResult = await getCourseBySlug(supabase, slug);

    if (courseResult.error || !courseResult.data) {

      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const lessonResult = await validateLesson(
      supabase,
      lessonId,
      courseResult.data.id
    );

    if (lessonResult.error || !lessonResult.data) {

      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { feedback_type }: { feedback_type?: FeedbackType } = body;

    if (!feedback_type || !VALID_FEEDBACK.includes(feedback_type)) {
      return NextResponse.json(
        { error: 'feedback_type inválido' },
        { status: 400 }
      );
    }

    const { data: existingFeedback, error: existingError } = await supabase
      .from('lesson_feedback')
      .select('id, feedback_type')
      .eq('lesson_id', lessonId)
      .eq('user_id', user.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Error al verificar feedback' },
        { status: 500 }
      );
    }

    if (existingFeedback) {
      if (existingFeedback.feedback_type === feedback_type) {
        const { error: deleteError } = await supabase
          .from('lesson_feedback')
          .delete()
          .eq('id', existingFeedback.id);

        if (deleteError) {
          return NextResponse.json(
            { error: 'Error al eliminar feedback' },
            { status: 500 }
          );
        }

        return NextResponse.json({ feedback_type: null, action: 'removed' });
      }

      const { error: updateError } = await supabase
        .from('lesson_feedback')
        .update({ feedback_type, updated_at: new Date().toISOString() })
        .eq('id', existingFeedback.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Error al actualizar feedback' },
          { status: 500 }
        );
      }

      return NextResponse.json({ feedback_type, action: 'updated' });
    }

    const { error: insertError } = await supabase.from('lesson_feedback').insert({
      lesson_id: lessonId,
      user_id: user.id,
      feedback_type,
    });

    if (insertError) {
      console.error('[FEEDBACK API] Error al insertar feedback:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar feedback', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback_type, action: 'created' });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
