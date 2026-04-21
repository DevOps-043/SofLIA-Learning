import type { SavePlanRequest } from './save-plan.types'
import {
  createAdminClient,
  getActiveMembershipOrganizationId,
  getUniqueCourseAssignmentOrganizationId,
  getUserProfileOrganizationId,
} from './save-plan-organization.service'

export function validateSavePlanRequest(body: SavePlanRequest): string | null {
  if (!body.config || !body.sessions) {
    return 'Configuracion y sesiones son requeridas'
  }

  if (
    !body.config.name
    || !body.config.timezone
    || !body.config.preferredDays
    || body.config.preferredDays.length === 0
  ) {
    return 'Faltan campos requeridos: name, timezone o preferredDays'
  }

  if (!Array.isArray(body.config.courseIds) || body.config.courseIds.length !== 1) {
    return 'Debes crear un plan para exactamente un curso a la vez'
  }

  if (!body.sessions.length) {
    return 'Debe haber al menos una sesion'
  }

  return null
}

export async function resolvePlanOrganization(params: {
  requestedOrganizationId: string | null
  selectedCourseId: string
  supabase: ReturnType<typeof createAdminClient>
  userId: string
}) {
  if (params.requestedOrganizationId) {
    return getActiveMembershipOrganizationId(params.supabase, {
      requestedOrganizationId: params.requestedOrganizationId,
      userId: params.userId,
    })
  }

  return (
    (await getUniqueCourseAssignmentOrganizationId(params.supabase, {
      courseId: params.selectedCourseId,
      userId: params.userId,
    }))
    || (await getUserProfileOrganizationId(params.supabase, params.userId))
    || (await getActiveMembershipOrganizationId(params.supabase, {
      userId: params.userId,
    }))
  )
}
