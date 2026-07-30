import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'
import { resolveLearningPathAccessForCourse } from '@/features/learning-paths/services/learning-path-access.server'
import { resolveQuestionsOrgScope } from '@/app/api/courses/_lib/question-org-scope'
import { buildLearnDataResponse } from './services/learn-data-response.service'
import { loadLearnDataPayload, loadCourseBySlug } from './services/learn-data-query.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const searchParams = new URL(request.url).searchParams
    const lessonId = searchParams.get('lessonId')
    const language = searchParams.get('language') || 'es'
    const organizationId = searchParams.get('orgId')
    const includeLessonData = searchParams.get('includeLessonData') === '1'
    const currentUser = await SessionService.getCurrentUser()
    const supabase = currentUser ? createAdminClient() : await createClient()

    // Fetch the course first (single fast query) so we can pass it to both
    // loadLearnDataPayload and resolveLearningPathAccessForCourse in parallel,
    // avoiding the sequential LP check that previously ran after the full data load.
    const course = await loadCourseBySlug(supabase, slug)

    // Las preguntas de la comunidad se acotan a la organización por la que el
    // usuario accede a ESTE curso, resuelta desde su inscripción. `orgId` llega
    // por query string y no es fiable como control de acceso, así que solo
    // desempata entre inscripciones que ya tiene (aquí además se usa el cliente
    // admin, sin RLS que lo respalde).
    const questionsOrgScope = await resolveQuestionsOrgScope(
      supabase,
      currentUser,
      course.id,
      organizationId,
    )

    const [payload, learningPathState] = await Promise.all([
      loadLearnDataPayload(
        supabase,
        slug,
        lessonId,
        language,
        questionsOrgScope,
        currentUser?.id,
        organizationId,
        includeLessonData,
        course,
      ),
      currentUser?.id
        ? resolveLearningPathAccessForCourse({
            userId: currentUser.id,
            courseId: course.id,
            organizationId,
          })
        : Promise.resolve(null),
    ])

    if (learningPathState && !learningPathState.currentCourseUnlocked) {
      return withCacheHeaders(
        NextResponse.json(
          {
            error: 'CURSO_BLOQUEADO_POR_LEARNING_PATH',
            message:
              'Este taller pertenece a un learning path y todavía no se ha desbloqueado.',
            learningPath: learningPathState,
          },
          { status: 423 },
        ),
        cacheHeaders.dynamic,
      )
    }

    payload.learningPathState = learningPathState

    return withCacheHeaders(
      NextResponse.json(buildLearnDataResponse(payload)),
      cacheHeaders.dynamic,
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === 'COURSE_NOT_FOUND'
            ? 'Curso no encontrado'
            : 'Error interno del servidor',
        details:
          error instanceof Error && error.message !== 'COURSE_NOT_FOUND'
            ? error.message
            : undefined,
      },
      {
        status:
          error instanceof Error && error.message === 'COURSE_NOT_FOUND'
            ? 404
            : 500,
      },
    )
  }
}
