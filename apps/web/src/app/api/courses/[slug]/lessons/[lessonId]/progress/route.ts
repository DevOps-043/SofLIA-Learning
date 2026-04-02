import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import {
  completeLessonProgress,
} from './services/lesson-progress-completion.service'
import { parseLessonProgressRequestBody } from './services/lesson-progress-request.service'
import { LessonProgressError } from './services/lesson-progress.shared'

interface ProgressSuccessResponse {
  success: true
  message: string
  progress: {
    lesson_id: string
    is_completed: boolean
    overall_progress: number
  }
}

interface ProgressErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const parsedRequest = parseLessonProgressRequestBody(await request.text())
    if (parsedRequest.error) {
      return NextResponse.json<ProgressErrorResponse>(
        {
          error: parsedRequest.error.error,
          details:
            'details' in parsedRequest.error
              ? parsedRequest.error.details
              : undefined,
        },
        { status: parsedRequest.error.status },
      )
    }

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json<ProgressErrorResponse>(
        { error: 'No autenticado' },
        { status: 401 },
      )
    }

    const { slug, lessonId } = await params
    const supabase = await createClient()
    const progress = await completeLessonProgress(
      supabase,
      currentUser.id,
      slug,
      lessonId,
    )

    return NextResponse.json<ProgressSuccessResponse>({
      success: true,
      message: 'Leccion marcada como completada',
      progress: {
        lesson_id: progress.lessonId,
        is_completed: true,
        overall_progress: progress.overallProgress,
      },
    })
  } catch (error) {
    if (error instanceof LessonProgressError) {
      return NextResponse.json<ProgressErrorResponse>(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.status },
      )
    }

    return NextResponse.json<ProgressErrorResponse>(
      {
        error: 'Error interno del servidor',
        details: {
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
      },
      { status: 500 },
    )
  }
}
