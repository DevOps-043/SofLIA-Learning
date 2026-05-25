import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { subscriptionUpdateSchema, type SubscriptionUpdateBody } from './schema'

/**
 * GET /api/business/settings/subscription
 * Obtiene información de suscripción de la organización
 */
export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403)
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // Obtener datos de la organización (incluye información de suscripción y billing_cycle)
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, billing_cycle, max_users')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      logger.error('Error fetching organization subscription:', orgError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener datos de suscripción'
      }, { status: 500 })
    }

    // Obtener suscripciones activas del usuario (business user) - ordenadas por fecha de creación descendente
    const { data: userSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select(SELECT_COLUMNS.subscriptions)
      .eq('user_id', auth.userId)
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false })

    if (subsError) {
      logger.error('Error fetching user subscriptions:', subsError)
    }

    // Usar las fechas de la suscripción activa del usuario si están disponibles, 
    // o usar las fechas de la organización como respaldo
    const activeSubscription = userSubscriptions && userSubscriptions.length > 0 ? userSubscriptions[0] : null
    
    // Priorizar fechas de la suscripción activa del usuario, luego las de la organización
    const startDate = activeSubscription?.start_date || organization.subscription_start_date
    const endDate = activeSubscription?.end_date || activeSubscription?.next_billing_date || organization.subscription_end_date

    // Calcular información adicional
    const now = new Date()
    const endDateObj = endDate ? new Date(endDate) : null
    const isExpired = endDateObj ? endDateObj < now : false
    const daysUntilExpiration = endDateObj ? Math.ceil((endDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
    const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0

    // Normalizar el plan a lowercase para consistencia
    const normalizedPlan = organization.subscription_plan?.toLowerCase()?.trim() || 'team'
    
    return NextResponse.json({
      success: true,
      subscription: {
        plan: normalizedPlan,
        status: organization.subscription_status || 'active',
        billing_cycle: organization.billing_cycle?.toLowerCase()?.trim() || 'yearly',
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
    logger.error('💥 Error in /api/business/settings/subscription:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener datos de suscripción'
    }, { status: 500 })
  }
}

export const PUT = withZodBody(subscriptionUpdateSchema, handlePut)

/**
 * PUT /api/business/settings/subscription
 * Actualiza el plan de suscripción de la organización
 */
async function handlePut(
  _request: NextRequest,
  body: SubscriptionUpdateBody,
  _context: unknown,
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403)
    }

    const { planId, billingCycle } = body

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // Obtener datos actuales de la organización
    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, billing_cycle, max_users')
      .eq('id', organizationId)
      .single()

    if (orgError || !currentOrg) {
      logger.error('Error fetching organization:', orgError)
      return apiError('FETCH_ORGANIZATION_FAILED', 'Error al obtener datos de la organización', 500)
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (planId) {
      // Validar que el plan existe
      const validPlans = ['team', 'business', 'enterprise']
      if (!validPlans.includes(planId.toLowerCase())) {
        return apiError(
          'INVALID_PLAN',
          'Plan inválido. Los planes válidos son: team, business, enterprise',
          400,
        )
      }

      updateData.subscription_plan = planId.toLowerCase()

      // Definir límite de usuarios según el plan
      const maxUsersByPlan: Record<string, number> = {
        team: 10,
        business: 50,
        enterprise: 999999
      }

      updateData.max_users = maxUsersByPlan[planId.toLowerCase()] || 10
    }

    if (billingCycle) {
      // Validar que el ciclo de facturación es válido
      if (!['monthly', 'yearly'].includes(billingCycle.toLowerCase())) {
        return apiError(
          'INVALID_BILLING_CYCLE',
          'Ciclo de facturación inválido. Los valores válidos son: monthly, yearly',
          400,
        )
      }

      updateData.billing_cycle = billingCycle.toLowerCase()

      // Si se cambia el ciclo de facturación, recalcular fechas
      if (currentOrg.subscription_start_date) {
        const startDate = new Date(currentOrg.subscription_start_date)
        const endDate = new Date()

        if (billingCycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        updateData.subscription_end_date = endDate.toISOString()
      }
    }

    // Si se actualizó el plan o el ciclo de facturación, actualizar fechas
    if (planId && billingCycle && currentOrg.subscription_start_date) {
      const startDate = new Date()
      const endDate = new Date()

      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      updateData.subscription_start_date = startDate.toISOString()
      updateData.subscription_end_date = endDate.toISOString()
    }

    // Actualizar organización
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating organization subscription:', updateError)
      return apiError('UPDATE_SUBSCRIPTION_FAILED', 'Error al actualizar el plan de suscripción', 500)
    }

    logger.info('Subscription plan updated successfully', {
      organizationId,
      updates: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Plan actualizado exitosamente',
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
    logger.error('💥 Error in PUT /api/business/settings/subscription:', error)
    return apiError('UPDATE_SUBSCRIPTION_FAILED', 'Error al actualizar el plan de suscripción', 500)
  }
}
