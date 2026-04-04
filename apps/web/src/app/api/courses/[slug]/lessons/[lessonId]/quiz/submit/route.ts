import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { calculateCombinedLessonProgress } from '@/lib/utils/lesson-progress';

interface QuizQuestionRow {
  id?: string;
  question_id?: string;
  correctAnswer?: string | number;
  options?: string[];
  questionType?: string;
  points?: number;
}

interface QuizSubmissionMatch {
  user_id: string;
  lesson_id: string;
  enrollment_id: string;
  material_id?: string;
  activity_id?: string;
}

/**
 * POST /api/courses/[slug]/lessons/[lessonId]/quiz/submit
 * Guarda las respuestas de un quiz y calcula el resultado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();

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

    // Obtener o crear enrollment del usuario
    let { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 404 }
      );
    }

    const enrollmentId = enrollment.enrollment_id;

    // Obtener datos del body
    const body = await request.json();
    const { 
      answers, 
      quizData, 
      materialId, 
      activityId,
      totalPoints 
    } = body;

    // Validar que tenemos los datos necesarios
    if (!answers || !quizData || (!materialId && !activityId)) {
      return NextResponse.json(
        { error: 'Datos incompletos: se requieren answers, quizData y materialId o activityId' },
        { status: 400 }
      );
    }

    // Validar que la lección existe
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .eq('lesson_id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Calcular puntuación
    let correctAnswers = 0;
    let pointsEarned = 0;
    const questions = Array.isArray(quizData) ? quizData : (quizData.questions || []);
    const totalQuestions = questions.length;

    // Función para normalizar strings y comparar opciones
    const normalizeOption = (text: string): string => {
      return text
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
    };

    // Función para normalizar verdadero/falso
    const normalizeTrueFalse = (value: string): string => {
      const normalized = normalizeOption(value);
      if (normalized === 'true' || normalized === 'verdadero') return 'verdadero';
      if (normalized === 'false' || normalized === 'falso') return 'falso';
      return normalized;
    };

    // Función para verificar si una respuesta es correcta
    const isAnswerCorrect = (question: QuizQuestionRow, selectedAnswer: string | number): boolean => {
      const correctAnswer = question.correctAnswer;
      const options = question.options || [];

      // Si es pregunta de verdadero/falso
      if (question.questionType === 'true_false') {
        if (typeof selectedAnswer === 'number') {
          const selectedOption = options[selectedAnswer];
          if (typeof correctAnswer === 'string') {
            return normalizeTrueFalse(selectedOption) === normalizeTrueFalse(correctAnswer);
          }
          if (typeof correctAnswer === 'number') {
            return selectedAnswer === correctAnswer;
          }
        }
        if (typeof selectedAnswer === 'string') {
          if (typeof correctAnswer === 'string') {
            return normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(correctAnswer);
          }
          if (typeof correctAnswer === 'number') {
            return normalizeTrueFalse(selectedAnswer) === normalizeTrueFalse(options[correctAnswer]);
          }
        }
        return false;
      }

      // Para otros tipos de preguntas
      if (typeof selectedAnswer === 'number') {
        if (typeof correctAnswer === 'number') {
          return selectedAnswer === correctAnswer;
        }
        if (typeof correctAnswer === 'string') {
          const selectedOption = options[selectedAnswer];
          return normalizeOption(selectedOption) === normalizeOption(correctAnswer);
        }
      }

      if (typeof selectedAnswer === 'string') {
        if (typeof correctAnswer === 'string') {
          return normalizeOption(selectedAnswer) === normalizeOption(correctAnswer);
        }
        if (typeof correctAnswer === 'number') {
          return normalizeOption(selectedAnswer) === normalizeOption(options[correctAnswer]);
        }
      }

      return false;
    };

    // Calcular respuestas correctas
    questions.forEach((question: QuizQuestionRow) => {
      const questionId = question.id || question.question_id;
      const selectedAnswer = answers[questionId];

      if (selectedAnswer !== undefined && isAnswerCorrect(question, selectedAnswer)) {
        correctAnswers++;
        pointsEarned += question.points || 1;
      }
    });

    // Calcular porcentaje
    const percentageScore = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100
      : 0;

    // Verificar si aprobó (≥80%)
    const isPassed = percentageScore >= 80;

    // Calcular puntos totales
    const calculatedTotalPoints =
      totalPoints ||
      questions.reduce((sum: number, question: QuizQuestionRow) => sum + (question.points || 1), 0);

    // Guardar o actualizar submission
    const now = new Date().toISOString();
    
    // Verificar si ya existe una submission
    const submissionQuery: QuizSubmissionMatch = {
      user_id: currentUser.id,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
    };

    if (materialId) {
      submissionQuery.material_id = materialId;
    }
    if (activityId) {
      submissionQuery.activity_id = activityId;
    }

    const { data: existingSubmission } = await supabase
      .from('user_quiz_submissions')
      .select('submission_id, percentage_score, is_passed')
      .match(submissionQuery)
      .single();

    let submissionResult;
    let shouldUpdate = false;
    let shouldSave = true;

    if (existingSubmission) {
      const previousScore = existingSubmission.percentage_score || 0;
      const previousPassed = existingSubmission.is_passed || false;

      // Lógica de guardado:
      // 1. Si el nuevo puntaje es >= 80%, siempre guardar (último intento aprobado)
      // 2. Si el nuevo puntaje es < 80%, solo guardar si es mejor que el anterior
      // 3. Si ya se pasó antes (>= 80%), no guardar intentos que no aprueban
      
      if (isPassed) {
        // Si aprobó (>= 80%), siempre guardar (último intento aprobado)
        shouldUpdate = true;
        shouldSave = true;
      } else if (previousPassed) {
        // Si ya había aprobado antes, no guardar intentos que no aprueban
        // (mantener el último intento aprobado)
        shouldUpdate = false;
        shouldSave = false;
      } else {
        // Si no ha aprobado, solo guardar si el nuevo puntaje es mejor
        shouldUpdate = percentageScore > previousScore;
        shouldSave = shouldUpdate;
      }

      if (shouldUpdate) {
        // Actualizar submission existente
        const { data, error } = await supabase
          .from('user_quiz_submissions')
          .update({
            user_answers: answers,
            score: correctAnswers,
            total_points: calculatedTotalPoints,
            percentage_score: percentageScore,
            is_passed: isPassed,
            completed_at: now,
            updated_at: now,
          })
          .eq('submission_id', existingSubmission.submission_id)
          .select()
          .single();

        if (error) {
          console.error('Error actualizando submission:', error);
          return NextResponse.json(
            { error: 'Error al actualizar respuestas del quiz' },
            { status: 500 }
          );
        }

        submissionResult = data;
      } else {
        // No actualizar, usar el submission existente
        submissionResult = existingSubmission;
      }
    } else {
      // Crear nueva submission (siempre se guarda la primera vez)
      const { data, error } = await supabase
        .from('user_quiz_submissions')
        .insert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          material_id: materialId || null,
          activity_id: activityId || null,
          user_answers: answers,
          score: correctAnswers,
          total_points: calculatedTotalPoints,
          percentage_score: percentageScore,
          is_passed: isPassed,
          completed_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando submission:', error);
        return NextResponse.json(
          { error: 'Error al guardar respuestas del quiz' },
          { status: 500 }
        );
      }

      submissionResult = data;
      shouldSave = true;
    }

    // Verificar si la lección tiene quizzes antes de actualizar el progreso
    // Solo aplicar la lógica de quiz si realmente hay quizzes en la lección
    const { data: materialQuizzes } = await supabase
      .from('lesson_materials')
      .select('material_id')
      .eq('lesson_id', lessonId)
      .eq('material_type', 'quiz');

    const { data: activityQuizzes } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('lesson_id', lessonId)
      .eq('activity_type', 'quiz')
      .eq('is_required', true);

    const hasQuizzes = ((materialQuizzes?.length || 0) + (activityQuizzes?.length || 0)) > 0;

    // Actualizar user_lesson_progress con datos del quiz
    // Solo actualizar si se guardó el nuevo intento Y hay quizzes en la lección
    if (shouldSave && hasQuizzes) {
      const { data: existingProgress } = await supabase
        .from('user_lesson_progress')
        .select('progress_id, quiz_progress_percentage, quiz_passed, video_progress_percentage')
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', lessonId)
        .single();

      // Usar el mejor puntaje: el más alto entre el anterior y el nuevo
      const bestScore = existingProgress?.quiz_progress_percentage 
        ? Math.max(existingProgress.quiz_progress_percentage, percentageScore)
        : percentageScore;
      
      // Si ya había aprobado antes o aprobó ahora, marcar como aprobado
      const bestPassed = existingProgress?.quiz_passed || isPassed;
      
      // Obtener progreso del video (usar el existente o 0 si no existe)
      const videoProgress = existingProgress?.video_progress_percentage || 0;
      
      // Calcular progreso combinado (50% video + 50% quiz si quiz_passed = true)
      // Solo aplica si hay quizzes (hasQuizzes = true)
      const combinedProgress = calculateCombinedLessonProgress(videoProgress, bestPassed, hasQuizzes);

      if (existingProgress) {
        // Actualizar progreso existente con el mejor puntaje
        await supabase
          .from('user_lesson_progress')
          .update({
            quiz_progress_percentage: bestScore,
            quiz_completed: true,
            quiz_passed: bestPassed,
            updated_at: now,
          })
          .eq('progress_id', existingProgress.progress_id);
      } else {
        // Crear nuevo progreso si no existe
        await supabase
          .from('user_lesson_progress')
          .insert({
            user_id: currentUser.id,
            lesson_id: lessonId,
            enrollment_id: enrollmentId,
            quiz_progress_percentage: bestScore,
            quiz_completed: true,
            quiz_passed: bestPassed,
            started_at: now,
            last_accessed_at: now,
          });
      }
    }

    // Mensaje según si se guardó o no
    let message = '';
    if (!shouldSave && existingSubmission) {
      const previousScore = existingSubmission.percentage_score || 0;
      if (previousScore >= 80) {
        message = `Ya habías aprobado este quiz con ${previousScore}%. Este intento no mejoró tu puntaje.`;
      } else {
        message = `Tu mejor puntaje sigue siendo ${previousScore}%. Este intento no mejoró tu resultado.`;
      }
    } else if (isPassed) {
      message = '¡Quiz aprobado!';
    } else {
      message = 'Quiz completado, pero no alcanzaste el 80% requerido. Puedes intentarlo de nuevo para mejorar tu puntaje.';
    }

    return NextResponse.json({
      success: true,
      message,
      saved: shouldSave,
      result: {
        score: correctAnswers,
        totalQuestions,
        totalPoints: calculatedTotalPoints,
        pointsEarned,
        percentage: percentageScore,
        isPassed,
        submission: submissionResult,
        bestScore: shouldSave ? percentageScore : (existingSubmission?.percentage_score || percentageScore),
      },
    });
  } catch (error) {
    console.error('Error en POST /api/courses/[slug]/lessons/[lessonId]/quiz/submit:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
