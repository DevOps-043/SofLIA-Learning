import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  changePlanSchema,
  type ChangePlanBody,
} from '../../../_schemas'

interface ChangePlanUpdatePayload {
  subscription_plan: string
  subscription_start_date: string
  subscription_end_date: string
  billing_cycle: 'monthly' | 'yearly'
  max_users: number
  updated_at: string
}

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

/**
 * POST /api/[orgSlug]/business/settings/subscription/change-plan
 * Cambia el plan de suscripcion de la organizacion activa
 */
async function handlePost(
  _request: NextRequest,
  body: ChangePlanBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No autorizado', 403)
    }

    const { planId, billingCycle } = body

    if (planId === 'enterprise') {
      return apiError(
        'ENTERPRISE_REQUIRES_SALES',
        'Para el plan Enterprise, por favor contacta con nuestro equipo de ventas.',
        400,
      )
    }

    const supabase = await createClient()

    const { error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, max_users')
      .eq('id', auth.organizationId)
      .single()

    if (orgError) {
      logger.error('Error fetching org:', orgError)
      return apiError('FETCH_ORGANIZATION_FAILED', 'Error al obtener datos', 500)
    }

    const now = new Date()
    const startDate = now
    const endDate = new Date()
    if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
    else endDate.setFullYear(endDate.getFullYear() + 1)

    const maxUsersByPlan: Record<string, number> = { team: 10, business: 50, enterprise: 999999 }
    const newMaxUsers = maxUsersByPlan[planId] || 10

    const updateData: ChangePlanUpdatePayload = {
      subscription_plan: planId,
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      billing_cycle: billingCycle,
      max_users: newMaxUsers,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select()
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating plan:', updateError)
      return apiError('UPDATE_PLAN_FAILED', 'Error al actualizar el plan', 500)
    }

    logger.info('Plan changed successfully', { orgSlug, planId, billingCycle })

    return NextResponse.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      organization: updatedOrg,
      subscription: {
        plan: planId,
        billing_cycle: billingCycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        max_users: newMaxUsers,
      },
    })
  } catch (error) {
    logger.error('Error in POST /api/[orgSlug]/business/settings/subscription/change-plan:', error)
    return apiError('CHANGE_PLAN_FAILED', 'Error interno', 500)
  }
}

export const POST = withZodBody(changePlanSchema, handlePost)
