import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '../../../../features/auth/services/session.service'
import {
  buildStudyPlannerSessionsResponse,
} from './study-planner-sessions.server.service'
import {
  StudyPlannerSessionsRequestError,
} from './study-planner-sessions.types'
import {
  parseStudyPlannerSessionsDateRange,
} from './study-planner-sessions.utils'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'No autorizado',
          sessions: [],
        },
        { status: 401 },
      )
    }

    const { startDate, endDate } = parseStudyPlannerSessionsDateRange(
      request.url,
    )
    const planId = new URL(request.url).searchParams.get('planId') || undefined
    const response = await buildStudyPlannerSessionsResponse({
      userId: user.id,
      startDate,
      endDate,
      planId,
    })

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof StudyPlannerSessionsRequestError) {
      return NextResponse.json(
        {
          error: error.message,
          sessions: [],
        },
        { status: error.status },
      )
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error interno del servidor',
        sessions: [],
      },
      { status: 500 },
    )
  }
}
