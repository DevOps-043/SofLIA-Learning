import { NextResponse } from 'next/server'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import {
  missingOrganizationResponse,
  missingSlugResponse,
  unauthenticatedResponse,
} from './dashboard-responses'
import type { DashboardAuthContext, RouteContext } from './dashboard.types'

export async function resolveDashboardAuth(
  context: RouteContext,
): Promise<DashboardAuthContext | NextResponse> {
  const { orgSlug } = await context.params

  if (!orgSlug) return missingSlugResponse()

  const auth = await requireBusinessUser({ organizationSlug: orgSlug })
  if (auth instanceof NextResponse) {
    logger.error('Auth failed in business-user/dashboard:', auth.status)
    return auth
  }

  if (!auth.userId) {
    logger.error('No userId in auth object')
    return unauthenticatedResponse()
  }

  if (!auth.organizationId) {
    logger.error('No organizationId in auth object for user:', auth.userId)
    return missingOrganizationResponse()
  }

  return {
    userId: auth.userId,
    organizationId: auth.organizationId,
    orgSlug,
  }
}
