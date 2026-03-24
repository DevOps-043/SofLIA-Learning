import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/[orgSlug]/business/settings/subscription
 * Obtiene información de suscripción de la organización activa
 */
export async function GET(
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

    const supabase = await createClient()

    // Obtener datos de la organización
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, billing_cycle, max_users')
      .eq('id', auth.organizationId)
      .single()

    if (orgError) {
      logger.error('Error fetching organization subscription:', orgError)
      return NextResponse.json({ success: false, error: 'Error al obtener datos' }, { status: 500 })
    }

    // Obtener suscripciones activas del usuario (como respaldo o info adicional)
    const { data: userSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false })

    const activeSubscription = userSubscriptions && userSubscriptions.length > 0 ? userSubscriptions[0] : null
    
    const startDate = activeSubscription?.start_date || organization.subscription_start_date
    const endDate = activeSubscription?.end_date || activeSubscription?.next_billing_date || organization.subscription_end_date

    // Cálculos de expiración
    const now = new Date()
    const endDateObj = endDate ? new Date(endDate) : null
    const isExpired = endDateObj ? endDateObj < now : false
    const daysUntilExpiration = endDateObj ? Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
    const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0

    return NextResponse.json({
      success: true,
      subscription: {
        plan: organization.subscription_plan?.toLowerCase() || 'team',
        status: organization.subscription_status || 'active',
        billing_cycle: organization.billing_cycle || 'yearly',
        start_date: startDate,
        end_date: endDate,
        is_expired: isExpired,
        days_until_expiration: daysUntilExpiration,
        is_expiring_soon: isExpiringSoon,
        max_users: organization.max_users || 10,
        user_subscriptions: userSubscriptions || [],
        active_subscription: activeSubscription
      }
    })
  } catch (error) {
    logger.error('💥 Error in GET /api/[orgSlug]/business/settings/subscription:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
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
    const updateData: Record<string, any> = {
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
