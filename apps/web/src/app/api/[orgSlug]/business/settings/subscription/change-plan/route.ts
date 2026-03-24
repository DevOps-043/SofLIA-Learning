import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/[orgSlug]/business/settings/subscription/change-plan
 * Cambia el plan de suscripción de la organización activa
 */
export async function POST(
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
    const { planId, billingCycle }: { planId: string; billingCycle: 'monthly' | 'yearly' } = body

    if (!planId || !billingCycle) {
      return NextResponse.json({ success: false, error: 'planId y billingCycle son requeridos' }, { status: 400 })
    }

    const validPlans = ['team', 'business', 'enterprise']
    if (!validPlans.includes(planId.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Plan inválido' }, { status: 400 })
    }

    if (planId.toLowerCase() === 'enterprise') {
      return NextResponse.json({
        success: false,
        error: 'Para el plan Enterprise, por favor contacta con nuestro equipo de ventas.',
        requiresSalesContact: true
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Obtener datos actuales
    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, max_users')
      .eq('id', auth.organizationId)
      .single()

    if (orgError) {
      logger.error('Error fetching org:', orgError)
      return NextResponse.json({ success: false, error: 'Error al obtener datos' }, { status: 500 })
    }

    // Calcular nuevas fechas
    const now = new Date()
    const startDate = now
    let endDate = new Date()
    if (billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
    else endDate.setFullYear(endDate.getFullYear() + 1)

    const maxUsersByPlan: Record<string, number> = { team: 10, business: 50, enterprise: 999999 }
    const newMaxUsers = maxUsersByPlan[planId.toLowerCase()] || 10

    // Preparar actualización
    const updateData: Record<string, any> = {
      subscription_plan: planId.toLowerCase(),
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      billing_cycle: billingCycle,
      max_users: newMaxUsers,
      updated_at: new Date().toISOString()
    }

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select()
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating plan:', updateError)
      return NextResponse.json({ success: false, error: 'Error al actualizar el plan' }, { status: 500 })
    }

    logger.info('Plan changed successfully', { orgSlug, planId, billingCycle })

    return NextResponse.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      organization: updatedOrg,
      subscription: {
        plan: planId.toLowerCase(),
        billing_cycle: billingCycle,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        max_users: newMaxUsers
      }
    })
  } catch (error) {
    logger.error('💥 Error in POST /api/[orgSlug]/business/settings/subscription/change-plan:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
