import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { changePlanSchema, type ChangePlanBody } from './schema'

/**
 * POST /api/business/settings/subscription/change-plan
 * Cambia el plan de suscripción de la organización
 */
async function handlePost(
  _request: NextRequest,
  body: ChangePlanBody,
  _context: unknown,
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403)
    }

    const { planId, billingCycle } = body

    // Validar que el plan existe
    const validPlans = ['team', 'business', 'enterprise']
    if (!validPlans.includes(planId.toLowerCase())) {
      return apiError(
        'INVALID_PLAN',
        'Plan inválido. Los planes válidos son: team, business, enterprise',
        400,
      )
    }

    // Validar que el ciclo de facturación es válido
    if (!['monthly', 'yearly'].includes(billingCycle.toLowerCase())) {
      return apiError(
        'INVALID_BILLING_CYCLE',
        'Ciclo de facturación inválido. Los valores válidos son: monthly, yearly',
        400,
      )
    }

    // Enterprise requiere contacto de ventas
    if (planId.toLowerCase() === 'enterprise') {
      return apiError(
        'ENTERPRISE_REQUIRES_SALES',
        'Para el plan Enterprise, por favor contacta con nuestro equipo de ventas.',
        400,
        { details: { requiresSalesContact: true } },
      )
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // Obtener datos actuales de la organización
    // Intentar obtener billing_cycle, pero si no existe (migración no ejecutada), usar 'yearly' como default
    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, max_users')
      .eq('id', organizationId)
      .single()

    if (orgError || !currentOrg) {
      logger.error('Error fetching organization:', orgError)
      return apiError('FETCH_ORGANIZATION_FAILED', 'Error al obtener datos de la organización', 500)
    }

    // Intentar obtener billing_cycle si existe la columna
    let currentBillingCycle = 'yearly' // Default
    try {
      const { data: orgWithBilling } = await supabase
        .from('organizations')
        .select('billing_cycle')
        .eq('id', organizationId)
        .single()
      
      if (orgWithBilling?.billing_cycle) {
        currentBillingCycle = orgWithBilling.billing_cycle
      }
    } catch (e) {
      // Si la columna no existe, usar default
      logger.warn('billing_cycle column may not exist, using default: yearly')
    }

    const currentPlan = currentOrg.subscription_plan?.toLowerCase()
    const newPlan = planId.toLowerCase()

    // Si ya tiene el mismo plan y el mismo ciclo, no hacer nada
    if (currentPlan === newPlan && currentBillingCycle === billingCycle) {
      return NextResponse.json({
        success: true,
        message: 'Ya tienes este plan activo',
        organization: {
          ...currentOrg,
          subscription_plan: newPlan,
          billing_cycle: billingCycle
        }
      })
    }

    // Calcular fechas de suscripción
    const now = new Date()
    const startDate = now
    let endDate = new Date()

    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Definir límite de usuarios según el plan
    const maxUsersByPlan: Record<string, number> = {
      team: 10,
      business: 50,
      enterprise: 999999 // Ilimitado para enterprise
    }

    const newMaxUsers = maxUsersByPlan[newPlan] || 10

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {
      subscription_plan: newPlan,
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      max_users: newMaxUsers,
      updated_at: new Date().toISOString()
    }

    // Intentar agregar billing_cycle si la columna existe
    try {
      // Verificar si la columna billing_cycle existe
      const { error: checkError } = await supabase
        .from('organizations')
        .select('billing_cycle')
        .eq('id', organizationId)
        .limit(1)
      
      if (!checkError) {
        // La columna existe, podemos actualizarla
        updateData.billing_cycle = billingCycle
      } else {
        logger.warn('billing_cycle column may not exist, skipping update')
      }
    } catch (e) {
      // Si hay error, continuar sin billing_cycle
      logger.warn('Could not update billing_cycle, continuing without it')
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
      return apiError(
        'UPDATE_PLAN_FAILED',
        `Error al actualizar el plan de suscripción: ${updateError?.message || 'Error desconocido'}`,
        500,
      )
    }

    logger.info('Subscription plan changed successfully', {
      organizationId,
      fromPlan: currentPlan,
      toPlan: newPlan,
      billingCycle,
      maxUsers: newMaxUsers
    })

    // TODO: NOTIFICACIÓN DE PAGO
    // ====================================
    // Cuando se implemente la API de pagos, agregar aquí:
    // 1. Enviar notificación de cambio de plan al usuario
    // 2. Registrar el cambio en el historial de transacciones
    // 3. Enviar email de confirmación con detalles del cambio
    // ====================================

    return NextResponse.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      organization: updatedOrg,
      subscription: {
        plan: newPlan,
        billing_cycle: billingCycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        max_users: newMaxUsers
      },
      // TODO: Agregar información de pago cuando esté disponible
      // payment: {
      //   transaction_id: paymentResult.transactionId,
      //   amount: paymentResult.amount,
      //   currency: 'MXN',
      //   next_billing_date: endDate.toISOString()
      // }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/settings/subscription/change-plan:', error)
    return apiError('CHANGE_PLAN_FAILED', 'Error al cambiar el plan de suscripción', 500)
  }
}

export const POST = withZodBody(changePlanSchema, handlePost)
