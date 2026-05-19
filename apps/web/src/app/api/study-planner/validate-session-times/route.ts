import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '../../../../features/auth/services/session.service'
import { UserContextService } from '../../../../features/study-planner/services/user-context.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger as techDebtLogger } from '@/lib/utils/logger'

import {
  validateSessionTimesSchema,
  type ValidateSessionTimesBody,
} from '../_schemas'
import {
  validateSessionTimesForUser,
  type ValidateSessionTimesResponse,
} from './validate-session-times.service'

async function handlePost(
  _request: NextRequest,
  body: ValidateSessionTimesBody,
): Promise<NextResponse<ValidateSessionTimesResponse> | Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const userContext = await UserContextService.getFullUserContext(user.id)
    const data = await validateSessionTimesForUser(user.id, userContext, body)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    techDebtLogger.error('Error validando tiempos de sesion:', error)
    return apiError('VALIDATE_SESSION_TIMES_FAILED', 'Error interno del servidor', 500)
  }
}

export const POST = withZodBody(validateSessionTimesSchema, handlePost)
