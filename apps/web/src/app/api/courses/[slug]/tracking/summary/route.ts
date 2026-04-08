import { NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { getCourseTrackingSummary } from '@/features/courses/services/activity-tracking.server.service'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { slug } = await params
    const supabase = await createClient()
    const summary = await getCourseTrackingSummary(supabase, currentUser.id, slug)

    if (!summary) {
      return NextResponse.json(
        { error: 'No se encontro informacion de seguimiento para este curso' },
        { status: 404 },
      )
    }

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    )
  }
}
