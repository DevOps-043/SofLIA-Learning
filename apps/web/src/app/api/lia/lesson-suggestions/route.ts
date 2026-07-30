import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseLessonContext } from '@/features/courses/services/activity-submission.server.service'
import { resolveAnyScopeCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { sanitizeContextPayload } from '@/lib/security/context-sanitizer'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  lessonSuggestionsRequestSchema,
  type LessonSuggestionsRequest,
} from '../_schemas'

import {
  computeLessonContentHash,
  readCachedSuggestions,
  upsertCachedSuggestions,
} from './lesson-suggestions.cache'
import {
  generateLessonSuggestions,
  LessonSuggestionsGenerationError,
} from './lesson-suggestions.service'
import {
  type LessonContextSnapshot,
  type LessonSuggestionsResponse,
} from './lesson-suggestions.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface LessonRow {
  lesson_id: string
  lesson_title: string | null
  lesson_description: string | null
  module_id: string
}

interface CourseRow {
  id: string
  title: string | null
}

async function handlePost(
  _request: NextRequest,
  body: LessonSuggestionsRequest,
  _context: unknown,
) {
  try {
    const sanitizedBody = sanitizeContextPayload(body)
    const { lessonId, courseSlug, language, activityFocus } = sanitizedBody

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const supabase = await createClient()

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('slug', courseSlug)
      .maybeSingle<CourseRow>()

    if (courseError || !course) {
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado', 404)
    }

    // Este endpoint no vive bajo `[orgSlug]` y el cliente no envía `orgId`, así
    // que el ámbito se deduce de la inscripción que el usuario ya tiene. Sin
    // esto, resolveCourseLessonContext busca una inscripción con
    // organization_id NULL —que ningún miembro de una organización tiene— y
    // rechazaba con 403 a todos los usuarios de empresa.
    const enrollmentScope = await resolveAnyScopeCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
    )

    try {
      await resolveCourseLessonContext(
        supabase,
        currentUser.id,
        courseSlug,
        lessonId,
        enrollmentScope?.organization_id ?? null,
      )
    } catch {
      return apiError(
        'LESSON_ACCESS_DENIED',
        'Sin acceso al curso o lección',
        403,
      )
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, lesson_description, module_id')
      .eq('lesson_id', lessonId)
      .maybeSingle<LessonRow>()

    if (lessonError || !lesson) {
      return apiError('LESSON_NOT_FOUND', 'Lección no encontrada', 404)
    }

    const snapshot: LessonContextSnapshot = {
      lessonId: lesson.lesson_id,
      lessonTitle: lesson.lesson_title ?? '',
      lessonDescription: lesson.lesson_description ?? undefined,
      courseTitle: course.title ?? '',
      courseSlug,
      language,
      activityFocus,
    }

    const adminClient = createAdminClient()
    const contentHash = computeLessonContentHash(snapshot)

    const cached = await readCachedSuggestions(
      adminClient,
      lessonId,
      language,
      contentHash,
    ).catch(() => null)

    if (cached) {
      const response: LessonSuggestionsResponse = {
        suggestions: cached.suggestions,
        source: 'cache',
        generatedAt: cached.generatedAt,
      }

      return NextResponse.json(response)
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      techDebtLogger.error(
        '[lesson-suggestions] GOOGLE_API_KEY missing; degrading gracefully',
      )
      return NextResponse.json(
        {
          suggestions: [],
          source: 'generated',
          generatedAt: new Date().toISOString(),
        } satisfies Omit<LessonSuggestionsResponse, 'suggestions'> & {
          suggestions: []
        },
        { status: 503 },
      )
    }

    let generatedAt: string
    try {
      const suggestions = await generateLessonSuggestions({
        snapshot,
        contentHash,
        apiKey,
      })

      generatedAt = await upsertCachedSuggestions(
        adminClient,
        lessonId,
        language,
        contentHash,
        suggestions,
      ).catch(() => new Date().toISOString())

      const response: LessonSuggestionsResponse = {
        suggestions,
        source: 'generated',
        generatedAt,
      }

      return NextResponse.json(response)
    } catch (error) {
      if (error instanceof LessonSuggestionsGenerationError) {
        techDebtLogger.warn('[lesson-suggestions] generation failed', {
          lessonId,
          language,
          message: error.message,
        })
        return NextResponse.json(
          {
            suggestions: [],
            source: 'generated',
            generatedAt: new Date().toISOString(),
          },
          { status: 503 },
        )
      }

      throw error
    }
  } catch (error) {
    techDebtLogger.error('[lesson-suggestions] unhandled error', error)
    return apiError(
      'LESSON_SUGGESTIONS_ERROR',
      'Error interno del servidor',
      500,
    )
  }
}

export const POST = withZodBody(lessonSuggestionsRequestSchema, handlePost)
