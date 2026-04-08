import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import {
  listUserStudyPlans,
  type ListedStudyPlan,
} from '@/features/study-planner/services/study-planner-plans.server.service'

interface PlansResponse {
  success: boolean
  data?: ListedStudyPlan[]
  error?: string
}

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<PlansResponse>> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      )
    }

    const plans = await listUserStudyPlans(user.id)

    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    )
  }
}
