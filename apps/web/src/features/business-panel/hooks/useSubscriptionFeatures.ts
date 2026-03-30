'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { hasFeature, getRequiredPlan, getFeatureMessage, getFeatureName, getAllowedNotificationChannels, type SubscriptionPlan, type FeatureKey } from '@/lib/subscription/subscriptionFeatures'

type BillingCycle = 'monthly' | 'yearly'

interface SubscriptionInfo {
  plan: SubscriptionPlan | null
  billing_cycle: BillingCycle | null
  status?: string
  start_date?: string | null
  end_date?: string | null
  max_users?: number
}

interface UseSubscriptionFeaturesReturn {
  plan: SubscriptionPlan | null
  billingCycle: BillingCycle | null
  subscription: SubscriptionInfo | null
  loading: boolean
  canUse: (feature: FeatureKey) => boolean
  getRequiredPlan: (feature: FeatureKey) => SubscriptionPlan | null
  getMessage: (feature: FeatureKey) => string
  getFeatureName: (feature: FeatureKey) => string
  getAllowedChannels: () => string[]
  changePlan: (planId: string, billingCycle: BillingCycle) => Promise<{ success: boolean; error?: string }>
  refetch: () => Promise<void>
}

/**
 * Hook para validar características según el plan de suscripción de la organización.
 *
 * IMPORTANTE: Este hook usa el orgSlug de la URL para asegurar
 * que se obtengan los datos de la organización correcta.
 */
export function useSubscriptionFeatures(): UseSubscriptionFeaturesReturn {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = useCallback(async () => {
    if (!orgSlug) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Usar la API org-scoped para obtener datos de la organización correcta
      const response = await fetch(`/api/${orgSlug}/business/settings`, {
        credentials: 'include'
      })

      let planValue: string | null = null
      let billingCycleValue: string = 'yearly'
      let subscriptionData: any = null

      if (response.ok) {
        const data = await response.json()

        // Primero intentar desde subscription
        if (data.success && data.subscription) {
          subscriptionData = data.subscription
          planValue = subscriptionData.plan?.toLowerCase()?.trim()
          billingCycleValue = subscriptionData.billing_cycle?.toLowerCase() || 'yearly'
        }

        // Si no hay plan en subscription, usar organization
        if (!planValue && data.organization?.subscription_plan) {
          planValue = data.organization.subscription_plan.toLowerCase()?.trim()
          billingCycleValue = data.organization.billing_cycle?.toLowerCase() || 'yearly'

          // Si no había subscriptionData, crearlo desde organization
          if (!subscriptionData) {
            subscriptionData = {
              plan: planValue,
              billing_cycle: billingCycleValue,
              status: data.organization.subscription_status,
              start_date: data.organization.subscription_start_date,
              end_date: data.organization.subscription_end_date,
              max_users: data.organization.max_users
            }
          }
        }
      }

      // Validar y establecer el plan
      if (planValue && ['team', 'business', 'enterprise'].includes(planValue)) {
        setPlan(planValue as SubscriptionPlan)
      } else {
        setPlan(null)
      }

      // Establecer billing cycle
      if (['monthly', 'yearly'].includes(billingCycleValue)) {
        setBillingCycle(billingCycleValue as BillingCycle)
      } else {
        setBillingCycle('yearly')
      }

      // Establecer subscription
      if (subscriptionData) {
        setSubscription({
          plan: (planValue && ['team', 'business', 'enterprise'].includes(planValue) ? planValue as SubscriptionPlan : null),
          billing_cycle: billingCycleValue as BillingCycle || 'yearly',
          status: subscriptionData.status,
          start_date: subscriptionData.start_date,
          end_date: subscriptionData.end_date,
          max_users: subscriptionData.max_users
        })
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Disparar evento personalizado SOLO cuando el plan cambia por acción del usuario
  // NO durante la carga inicial (esto evita loops infinitos de recargas)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [previousPlan, setPreviousPlan] = useState<SubscriptionPlan | null>(null)

  useEffect(() => {
    if (!loading && plan !== null) {
      // Marcar que ya se cargó inicialmente
      if (!hasInitiallyLoaded) {
        setHasInitiallyLoaded(true)
        setPreviousPlan(plan)
        return // No disparar evento en la carga inicial
      }

      // Solo disparar si el plan realmente cambió después de la carga inicial
      if (previousPlan !== null && previousPlan !== plan) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('subscription-plan-changed', {
            detail: { plan, billingCycle, subscription }
          }))
        }
        setPreviousPlan(plan)
      }
    }
  }, [loading, plan, billingCycle, subscription, hasInitiallyLoaded, previousPlan])

  const changePlan = useCallback(async (planId: string, billingCycle: BillingCycle): Promise<{ success: boolean; error?: string }> => {
    if (!orgSlug) {
      return { success: false, error: 'No se pudo determinar la organización' }
    }

    try {
      // Usar la API org-scoped
      const response = await fetch(`/api/${orgSlug}/business/subscription/change-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ planId, billingCycle })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('Error from API:', data)
        return {
          success: false,
          error: data.error || `Error al cambiar el plan (${response.status})`
        }
      }

      // Actualizar estado local después de cambiar el plan
      await fetchSubscription()

      return { success: true }
    } catch (error) {
      console.error('Network error changing plan:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión al cambiar el plan. Verifica tu conexión a internet.'
      }
    }
  }, [orgSlug, fetchSubscription])

  const canUse = useCallback((feature: FeatureKey): boolean => {
    if (!plan) {
      return false
    }
    return hasFeature(plan, feature)
  }, [plan])

  const getRequiredPlanForFeature = useCallback((feature: FeatureKey): SubscriptionPlan | null => {
    return getRequiredPlan(feature)
  }, [])

  const getMessage = useCallback((feature: FeatureKey): string => {
    return getFeatureMessage(feature, plan)
  }, [plan])

  const getFeatureNameForFeature = useCallback((feature: FeatureKey): string => {
    return getFeatureName(feature)
  }, [])

  const getAllowedChannels = useCallback((): string[] => {
    // Siempre retornar al menos email como canal por defecto
    const channels = getAllowedNotificationChannels(plan)
    return channels.length > 0 ? channels : ['email']
  }, [plan])

  return {
    plan,
    billingCycle,
    subscription,
    loading,
    canUse,
    getRequiredPlan: getRequiredPlanForFeature,
    getMessage,
    getFeatureName: getFeatureNameForFeature,
    getAllowedChannels,
    changePlan,
    refetch: fetchSubscription,
  }
}
