import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseLessonContext } from '@/features/courses/services/activity-submission.server.service'
import { sanitizeContextPayload } from '@/lib/security/context-sanitizer'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
  lessonSuggestionsRequestSchema,
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

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json()) as unknown
    const parsedBody = lessonSuggestionsRequestSchema.safeParse(rawBody)

    if (!parsedBody.success) {
      return jsonError('Payload inválido', 400)
    }

    const sanitizedBody = sanitizeContextPayload(parsedBody.data)
    const { lessonId, courseSlug, language, activityFocus } = sanitizedBody

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return jsonError('No autenticado', 401)
    }

    const supabase = await createClient()

    try {
      await resolveCourseLessonContext(
        supabase,
        currentUser.id,
        courseSlug,
        lessonId,
      )
    } catch {
      return jsonError('Sin acceso al curso o lección', 403)
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, lesson_description, module_id')
      .eq('lesson_id', lessonId)
      .maybeSingle<LessonRow>()

    if (lessonError || !lesson) {
      return jsonError('Lección no encontrada', 404)
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('slug', courseSlug)
      .maybeSingle<CourseRow>()

    if (courseError || !course) {
      return jsonError('Curso no encontrado', 404)
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
      console.error(
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
        console.warn('[lesson-suggestions] generation failed', {
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
    console.error('[lesson-suggestions] unhandled error', error)
    return jsonError('Error interno del servidor', 500)
  }
}
