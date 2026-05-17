import { NextRequest, NextResponse } from 'next/server'

import { requireBusiness } from '@/lib/auth/requireBusiness'

import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/utils/logger'

interface SubscriptionUpdatePayload {
  updated_at: string
  subscription_plan?: string
  billing_cycle?: 'monthly' | 'yearly'
  max_users?: number
}

/**
 * PUT /api/[orgSlug]/business/settings/subscription
 * Actualiza el plan de suscripción de la organización activa
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { planId, billingCycle }: { planId?: string; billingCycle?: 'monthly' | 'yearly' } = body

    const supabase = await createClient()

    // Preparar actualización
    const updateData: SubscriptionUpdatePayload = {
      updated_at: new Date().toISOString()
    }

    if (planId) {
      const validPlans = ['team', 'business', 'enterprise']
      if (!validPlans.includes(planId.toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Plan inválido' }, { status: 400 })
      }
      updateData.subscription_plan = planId.toLowerCase()
      
      const maxUsersByPlan: Record<string, number> = { team: 10, business: 50, enterprise: 999999 }
      updateData.max_users = maxUsersByPlan[planId.toLowerCase()] || 10
    }

    if (billingCycle) {
      if (!['monthly', 'yearly'].includes(billingCycle.toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Ciclo inválido' }, { status: 400 })
      }
      updateData.billing_cycle = billingCycle.toLowerCase()
    }

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select()
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating subscription:', updateError)
      return NextResponse.json({ success: false, error: 'Error al actualizar plan' }, { status: 500 })
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
        max_users: updatedOrg.max_users || 10
      }
    })
  } catch (error) {
    logger.error('💥 Error in PUT /api/[orgSlug]/business/settings/subscription:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
