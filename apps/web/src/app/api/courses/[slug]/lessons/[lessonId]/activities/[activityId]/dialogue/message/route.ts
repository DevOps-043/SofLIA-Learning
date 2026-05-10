import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseActivityContext } from '@/features/courses/services/activity-submission.server.service'
import { processDialogueMessage } from '@/features/courses/services/soflia-dialogue/dialogue-runtime.service'
import { DialogueRuntimeError } from '@/features/courses/services/soflia-dialogue/dialogue-runtime.errors'
import { dialogueMessageRequestSchema } from '@/features/courses/types/dialogue-runtime'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type RouteParams = {
  activityId: string
  lessonId: string
  slug: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsedRequest = dialogueMessageRequestSchema.safeParse(body)
    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: 'Payload invalido para el dialogo SofLIA',
          details: parsedRequest.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { activityId, lessonId, slug } = await params
    const supabase = await createClient()
    const context = await resolveCourseActivityContext(
      supabase,
      currentUser.id,
      slug,
      lessonId,
      activityId,
    )

    const adminClient = createAdminClient()
    const result = await processDialogueMessage({
      client: adminClient,
      clientTurnId: parsedRequest.data.clientTurnId,
      context,
      message: parsedRequest.data.message,
      sessionId: parsedRequest.data.sessionId,
    })

    return NextResponse.json(result)
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
