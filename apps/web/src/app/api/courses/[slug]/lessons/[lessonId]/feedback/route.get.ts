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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();

    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: feedback, error } = await supabase
      .from('lesson_feedback')
      .select('feedback_type')
      .eq('lesson_id', lessonId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Error al obtener feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback_type: feedback?.feedback_type ?? null });
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
