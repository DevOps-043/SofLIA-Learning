import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'
import { submitQuizAttempt } from './quiz-submit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { slug, lessonId } = await params
    const body = await request.json()
    const supabase = await createClient()
    const result = await submitQuizAttempt(supabase, {
      slug,
      lessonId,
      userId: currentUser.id,
      body,
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500

    if (status !== 500) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Error desconocido' },
        { status },
      )
    }

    console.error('Error en POST /api/courses/[slug]/lessons/[lessonId]/quiz/submit:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
