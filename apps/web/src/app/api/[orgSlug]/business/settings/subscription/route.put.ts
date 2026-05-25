import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'
import {
  subscriptionUpdateSchema,
  type SubscriptionUpdateBody,
} from '../../_schemas'

interface SubscriptionUpdatePayload {
  updated_at: string
  subscription_plan?: string
  billing_cycle?: 'monthly' | 'yearly'
  max_users?: number
}

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

/**
 * PUT /api/[orgSlug]/business/settings/subscription
 * Actualiza el plan de suscripcion de la organizacion activa
 */
async function handlePut(
  _request: NextRequest,
  body: SubscriptionUpdateBody,
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
    const supabase = await createClient()

    const updateData: SubscriptionUpdatePayload = {
      updated_at: new Date().toISOString(),
    }

    if (planId) {
      updateData.subscription_plan = planId

      const maxUsersByPlan: Record<string, number> = { team: 10, business: 50, enterprise: 999999 }
      updateData.max_users = maxUsersByPlan[planId] || 10
    }

    if (billingCycle) {
      updateData.billing_cycle = billingCycle
    }

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select()
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating subscription:', updateError)
      return apiError('UPDATE_SUBSCRIPTION_FAILED', 'Error al actualizar plan', 500)
    }

    return NextResponse.json({
      success: true,
      message: 'Plan actualizado',
      subscription: {
        plan: updatedOrg.subscription_plan || 'team',
        status: updatedOrg.subscription_status || 'active',
        billing_cycle: updatedOrg.billing_cycle || 'yearly',
        start_date: updatedOrg.subscription_start_date,
        end_date: updatedOrg.subscription_end_date,
        max_users: updatedOrg.max_users || 10,
      },
    })
  } catch (error) {
    logger.error('Error in PUT /api/[orgSlug]/business/settings/subscription:', error)
    return apiError('UPDATE_SUBSCRIPTION_FAILED', 'Error interno', 500)
  }
}

export const PUT = withZodBody(subscriptionUpdateSchema, handlePut)
