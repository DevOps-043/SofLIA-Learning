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
