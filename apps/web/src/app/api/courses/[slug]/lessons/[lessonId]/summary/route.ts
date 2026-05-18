import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers'
import { SessionService } from '@/features/auth/services/session.service'
import { resolveLearningPathAccessForCourse } from '@/features/learning-paths/services/learning-path-access.server'
import { normalizeLearnLanguage, resolveCourseLessonByLanguage } from '@/app/api/courses/_services/lesson-language-resolution.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const { searchParams } = new URL(request.url)
    const language = normalizeLearnLanguage(searchParams.get('language'))
    const organizationId = searchParams.get('orgId')?.trim() || null
    const supabase = await createClient()
    const currentUser = await SessionService.getCurrentUser()

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (currentUser?.id) {
      const learningPathState = await resolveLearningPathAccessForCourse({
        userId: currentUser.id,
        courseId: course.id,
        organizationId,
      })

      if (learningPathState && !learningPathState.currentCourseUnlocked) {
        return withCacheHeaders(
          NextResponse.json(
            {
              error: 'CURSO_BLOQUEADO_POR_LEARNING_PATH',
              message:
                'Este taller aún está bloqueado dentro de su learning path.',
              learningPath: learningPathState,
            },
            { status: 423 },
          ),
          cacheHeaders.dynamic,
        )
      }
    }

    const resolvedLesson = await resolveCourseLessonByLanguage({
      supabase,
      courseId: course.id,
      lessonId,
      requestedLanguage: language,
    })

    if (!resolvedLesson.lesson) {
      return NextResponse.json(
        { error: 'Leccion no encontrada o no pertenece al curso' },
        { status: 404 },
      )
    }

    return withCacheHeaders(
      NextResponse.json({
        summary_content: resolvedLesson.lesson.summary_content || null,
        translationContext: resolvedLesson.translationContext,
      }),
      cacheHeaders.static,
    )
  } catch (error) {
    techDebtLogger.error('[summary/route] Error inesperado:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
