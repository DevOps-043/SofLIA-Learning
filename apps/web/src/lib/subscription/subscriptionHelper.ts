/**
 * Helpers para validación de características en API routes
 */

import { NextResponse } from 'next/server'
import { hasFeature, getFeatureMessage, getRequiredPlan, getFeatureName, type SubscriptionPlan, type FeatureKey } from './subscriptionFeatures'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * Obtiene el plan de suscripción de una organización
 * Intenta obtener desde organizations.subscription_plan primero,
 * luego desde subscriptions.plan_type si está disponible
 */
export async function getOrganizationPlan(organizationId: string): Promise<SubscriptionPlan | null> {
  try {
    const supabase = await createClient()

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_plan')
      .eq('id', organizationId)
      .single()

    if (!orgError && organization?.subscription_plan) {
      const plan = organization.subscription_plan.toLowerCase()
      if (['team', 'business', 'enterprise'].includes(plan)) {
        return plan as SubscriptionPlan
      }
    }

    // Si no está en organizations, buscar en subscriptions (usar plan_id si está disponible)
    logger.warn('No se pudo determinar el plan de la organización', { organizationId })
    return null
  } catch (error) {
    logger.error('Error obteniendo plan de organización', error)
    return null
  }
}

/**
 * Requiere que una característica esté disponible para el plan de la organización
 * Retorna NextResponse con error 403 si la característica no está disponible
 * Retorna null si la característica está disponible
 */
export async function requireFeature(
  organizationId: string,
  feature: FeatureKey
): Promise<NextResponse | null> {
  const plan = await getOrganizationPlan(organizationId)

  if (!plan) {
    return NextResponse.json(
      {
        success: false,
        error: 'No se pudo determinar el plan de tu organización. Contacta al soporte.',
      },
      { status: 403 }
    )
  }

  if (!hasFeature(plan, feature)) {
    const requiredPlan = getRequiredPlan(feature)
    const planName = requiredPlan ? (requiredPlan === 'team' ? 'Team' : requiredPlan === 'business' ? 'Business' : 'Enterprise') : 'un plan superior'
    
    return NextResponse.json(
      {
        success: false,
        error: getFeatureMessage(feature, plan),
        required_plan: requiredPlan,
        feature_name: getFeatureName(feature),
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Verifica si una característica está disponible y retorna un booleano
 * Útil para validaciones sin necesidad de NextResponse
 */
export async function checkFeature(
  organizationId: string,
  feature: FeatureKey
): Promise<{ available: boolean; plan: SubscriptionPlan | null; message?: string }> {
  const plan = await getOrganizationPlan(organizationId)

  if (!plan) {
    return {
      available: false,
      plan: null,
      message: 'No se pudo determinar el plan de tu organización.',
    }
  }

  const available = hasFeature(plan, feature)
  
  return {
    available,
    plan,
    message: available ? undefined : getFeatureMessage(feature, plan),
  }
}
