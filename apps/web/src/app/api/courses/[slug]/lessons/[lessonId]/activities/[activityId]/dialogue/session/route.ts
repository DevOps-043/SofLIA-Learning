import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseActivityContext } from '@/features/courses/services/activity-submission.server.service'
import { getDialogueRuntimeSession } from '@/features/courses/services/soflia-dialogue/dialogue-runtime.service'
import { DialogueRuntimeError } from '@/features/courses/services/soflia-dialogue/dialogue-runtime.errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RouteParams = {
  activityId: string
  lessonId: string
  slug: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { activityId, lessonId, slug } = await params
    const supabase = await createClient()
    const organizationId =
      request.nextUrl.searchParams.get('orgId') ??
      request.nextUrl.searchParams.get('organizationId')
    const context = await resolveCourseActivityContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
      activityId,
      organizationId,
    )

    const adminClient = createAdminClient()
    const session = await getDialogueRuntimeSession({
      client: adminClient,
      context,
      restart: request.nextUrl.searchParams.get('restart') === '1',
    })

    return NextResponse.json({ session })
  } catch (error) {
    const status = error instanceof DialogueRuntimeError ? error.status : 500

    return NextResponse.json(
      {
        code: error instanceof DialogueRuntimeError ? error.code : undefined,
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
        details:
          error instanceof DialogueRuntimeError ? error.details : undefined,
      },
      { status },
    )
  }
}
