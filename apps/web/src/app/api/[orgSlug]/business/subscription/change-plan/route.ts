import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  changePlanSchema,
  type ChangePlanBody,
} from '../../_schemas'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * POST /api/[orgSlug]/business/subscription/change-plan
 * Cambia el plan de suscripcion de la organizacion especificada
 */
async function handlePost(
  _request: NextRequest,
  body: ChangePlanBody,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return apiError('ORG_SLUG_REQUIRED', 'Slug de organizacion requerido', 400)
    }

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.isOrgAdmin) {
      return apiError(
        'FORBIDDEN',
        'Solo los administradores pueden cambiar el plan de suscripcion',
        403,
      )
    }

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organizacion asignada', 403)
    }

    const { planId, billingCycle } = body

    if (planId === 'enterprise') {
      return apiError(
        'ENTERPRISE_REQUIRES_SALES',
        'Para el plan Enterprise, por favor contacta con nuestro equipo de ventas.',
        400,
        { details: { requiresSalesContact: true } },
      )
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, max_users, billing_cycle')
      .eq('id', organizationId)
      .single()

    if (orgError || !currentOrg) {
      logger.error('Error fetching organization:', orgError)
      return apiError(
        'FETCH_ORGANIZATION_FAILED',
        'Error al obtener datos de la organizacion',
        500,
      )
    }

    const currentPlan = currentOrg.subscription_plan?.toLowerCase()
    const currentBillingCycle = currentOrg.billing_cycle || 'yearly'
    const newPlan = planId

    if (currentPlan === newPlan && currentBillingCycle === billingCycle) {
      return NextResponse.json({
        success: true,
        message: 'Ya tienes este plan activo',
        organization: {
          ...currentOrg,
          subscription_plan: newPlan,
          billing_cycle: billingCycle,
        },
      })
    }

    const now = new Date()
    const startDate = now
    const endDate = new Date()

    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    const maxUsersByPlan: Record<string, number> = {
      team: 10,
      business: 50,
      enterprise: 999999,
    }

    const newMaxUsers = maxUsersByPlan[newPlan] || 10

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_plan: newPlan,
        billing_cycle: billingCycle,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        max_users: newMaxUsers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating organization subscription:', updateError)
      return apiError(
        'UPDATE_SUBSCRIPTION_PLAN_FAILED',
        `Error al actualizar el plan de suscripcion: ${updateError?.message || 'Error desconocido'}`,
        500,
      )
    }

    logger.info('Subscription plan changed successfully', {
      organizationId,
      fromPlan: currentPlan,
      toPlan: newPlan,
      billingCycle,
      maxUsers: newMaxUsers,
    })

    return NextResponse.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      organization: updatedOrg,
      subscription: {
        plan: newPlan,
        billing_cycle: billingCycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        max_users: newMaxUsers,
      },
    })
  } catch (error) {
    logger.error('Error in POST /api/[orgSlug]/business/subscription/change-plan:', error)
    return apiError('CHANGE_SUBSCRIPTION_PLAN_FAILED', 'Error al cambiar el plan de suscripcion', 500)
  }
}

export const POST = withZodBody(changePlanSchema, handlePost)
