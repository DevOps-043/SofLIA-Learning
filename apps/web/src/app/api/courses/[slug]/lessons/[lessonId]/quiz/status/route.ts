import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service';
import { buildQuizSubmissionSnapshot } from '@/features/courses/services/quiz-submission.service';

interface QuizSubmissionRow {
  activity_id?: string | null;
  completed_at?: string | null;
  material_id?: string | null;
  percentage_score?: number | null;
  is_passed?: boolean | null;
  score?: number | null;
  submission_id?: string | null;
  user_answers?: unknown;
}

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/quiz/status
 * Verifica el estado de los quizzes obligatorios de una lección
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();
    const organizationId = request.nextUrl.searchParams.get('orgId')?.trim() || null;

    // Verificar autenticación
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
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

    const courseId = course.id;

    // Obtener enrollment del usuario
    const enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      courseId,
      organizationId,
    );

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 404 }
      );
    }

    const enrollmentId = enrollment.enrollment_id;

    // Obtener quizzes obligatorios de la lección
    // 1. Quizzes en lesson_materials
    const { data: materialQuizzes, error: materialsError } = await supabase
      .from('lesson_materials')
      .select('material_id, material_title, material_type')
      .eq('lesson_id', lessonId)
      .eq('material_type', 'quiz');

    if (materialsError) {
      techDebtLogger.error('Error obteniendo quizzes de materiales:', materialsError);
    }

    // 2. Quizzes en lesson_activities (solo los obligatorios)
    const { data: activityQuizzes, error: activitiesError } = await supabase
      .from('lesson_activities')
      .select('activity_id, activity_title, activity_type, is_required')
      .eq('lesson_id', lessonId)
      .eq('activity_type', 'quiz')
      .eq('is_required', true);

    if (activitiesError) {
      techDebtLogger.error('Error obteniendo quizzes de actividades:', activitiesError);
    }

    const materialQuizzesList = materialQuizzes || [];
    const activityQuizzesList = activityQuizzes || [];
    const totalRequiredQuizzes = materialQuizzesList.length + activityQuizzesList.length;

    // Si no hay quizzes obligatorios, retornar que no se requieren
    if (totalRequiredQuizzes === 0) {
      return NextResponse.json({
        hasRequiredQuizzes: false,
        totalRequiredQuizzes: 0,
        completedQuizzes: 0,
        passedQuizzes: 0,
        allQuizzesPassed: true,
        quizzes: [],
      });
    }

    // Obtener submissions del usuario para esta lección
    const { data: submissions, error: submissionsError } = await supabase
      .from('user_quiz_submissions')
      .select(
        'submission_id, material_id, activity_id, percentage_score, is_passed, completed_at, score, user_answers'
      )
      .eq('user_id', currentUser.id)
      .eq('lesson_id', lessonId)
      .eq('enrollment_id', enrollmentId);

    if (submissionsError) {
      techDebtLogger.error('Error obteniendo submissions:', submissionsError);
    }

    const submissionsList: QuizSubmissionRow[] = submissions || [];

    // Construir información detallada de cada quiz
    const quizzesStatus = [];

    // Procesar quizzes de materiales
    for (const materialQuiz of materialQuizzesList) {
      const submission = submissionsList.find(
        (submissionRow) => submissionRow.material_id === materialQuiz.material_id
      );

      quizzesStatus.push({
        id: materialQuiz.material_id,
        title: materialQuiz.material_title,
        type: 'material',
        isCompleted: !!submission,
        isPassed: submission?.is_passed || false,
        latestSubmission: buildQuizSubmissionSnapshot({
          completedAt: submission?.completed_at,
          score: submission?.score,
          submissionId: submission?.submission_id,
          userAnswers: submission?.user_answers,
        }),
        percentage: submission?.percentage_score || 0,
        completedAt: submission?.completed_at || null,
      });
    }

    // Procesar quizzes de actividades
    for (const activityQuiz of activityQuizzesList) {
      const submission = submissionsList.find(
        (submissionRow) => submissionRow.activity_id === activityQuiz.activity_id
      );

      quizzesStatus.push({
        id: activityQuiz.activity_id,
        title: activityQuiz.activity_title,
        type: 'activity',
        isRequired: activityQuiz.is_required,
        isCompleted: !!submission,
        isPassed: submission?.is_passed || false,
        latestSubmission: buildQuizSubmissionSnapshot({
          completedAt: submission?.completed_at,
          score: submission?.score,
          submissionId: submission?.submission_id,
          userAnswers: submission?.user_answers,
        }),
        percentage: submission?.percentage_score || 0,
        completedAt: submission?.completed_at || null,
      });
    }

    // Calcular estadísticas
    const completedQuizzes = quizzesStatus.filter((q) => q.isCompleted).length;
    const passedQuizzes = quizzesStatus.filter((q) => q.isPassed).length;
    const allQuizzesPassed = quizzesStatus.every((q) => q.isPassed);

    return NextResponse.json({
      hasRequiredQuizzes: true,
      totalRequiredQuizzes,
      completedQuizzes,
      passedQuizzes,
      allQuizzesPassed,
      quizzes: quizzesStatus,
    });
  } catch (error) {
    techDebtLogger.error('Error en GET /api/courses/[slug]/lessons/[lessonId]/quiz/status:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
