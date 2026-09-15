import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Servicio para manejar cambio de planes de suscripción business
 * Este archivo contiene funciones que requieren acceso al servidor
 * Para funciones de utilidad sin dependencias de servidor, ver subscription.utils.ts
 */

import 'server-only'

import { fromLoose } from '@/lib/supabase/looseQuery'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BusinessPlanId, BillingCycle } from './subscription.utils'

/**
 * Servicio estático para verificar suscripciones
 */
export class SubscriptionService {
  /**
   * Verifica si un usuario tiene una suscripción activa (Team, Business o Enterprise)
   * Verifica la suscripción a nivel de organización
   *
   * @param userId - ID del usuario
   * @param organizationId - ID de la organización (recomendado para usuarios multi-empresa).
   *   Si se omite, se resuelve automáticamente desde organization_users (puede ser incorrecto
   *   cuando el usuario pertenece a múltiples empresas).
   */
  static async hasActiveSubscription(
    userId: string,
    organizationId?: string,
  ): Promise<boolean> {
    try {
      const supabase = createAdminClient()

      // Si se proporcionó organizationId directamente, usarlo sin resolución adicional
      let resolvedOrganizationId: string | null = organizationId ?? null

      if (!resolvedOrganizationId) {
        // Fallback: Buscar en la tabla organization_users
        // NOTA: Para usuarios multi-empresa esto puede retornar la org incorrecta.
        // Siempre pasar organizationId explícitamente cuando esté disponible.
        const { data: orgUser, error: orgUserError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle()

        if (!orgUserError && orgUser?.organization_id) {
          resolvedOrganizationId = orgUser.organization_id
        }
      } else {
      }

      // Reasignar para mantener compatibilidad con el resto del método
      const organizationId_resolved = resolvedOrganizationId

      if (!organizationId_resolved) {
        return false
      }

      // Verificar suscripción de la organización (con fechas)
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select(
          'id, name, subscription_plan, subscription_status, subscription_end_date, is_active',
        )
        .eq('id', organizationId_resolved)
        .single()

      if (orgError || !organization) {
        // Si no hay organización, intentar verificar en la tabla subscriptions
        return await this.checkSubscriptionTable(
          userId,
          organizationId_resolved,
        )
      }

      // Verificar que la organización esté activa
      if (!organization.is_active) {
        return false
      }

      // Verificar que el plan sea Team, Business o Enterprise
      const plan = organization.subscription_plan?.toLowerCase()?.trim()
      const validPlans = ['team', 'business', 'enterprise']

      if (!plan || !validPlans.includes(plan)) {
        // Si el plan no es válido, verificar en la tabla subscriptions
        return await this.checkSubscriptionTable(
          userId,
          organizationId_resolved,
        )
      }

      // Verificar que el estado sea activo o trial
      const status = organization.subscription_status?.toLowerCase()?.trim()
      const activeStatuses = ['active', 'trial']

      if (!status || !activeStatuses.includes(status)) {
        return false
      }

      // Verificar que la suscripción no haya expirado
      if (organization.subscription_end_date) {
        const endDate = new Date(organization.subscription_end_date)
        const now = new Date()

        if (endDate < now) {
          return false
        }
      }

      return true
    } catch (error) {
      techDebtLogger.error(
        '💥 [SubscriptionService] Error checking subscription:',
        error,
      )
      return false
    }
  }

  /**
   * Verifica suscripción en la tabla subscriptions como respaldo
   */
  private static async checkSubscriptionTable(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    try {
      const supabase = createAdminClient()

      // Buscar suscripción activa en la tabla subscriptions
      const { data: subscription, error: subError } = await fromLoose<{
        end_date: string | null
        plan_id: string | null
        subscription_status: string | null
      }>(supabase, 'subscriptions')
        .select('plan_id, subscription_status, end_date')
        .eq('organization_id', organizationId)
        .eq('subscription_status', 'active')
        .maybeSingle()

      if (subError || !subscription) {
        return false
      }

      // Verificar que el plan sea Team, Business o Enterprise
      const plan = subscription.plan_id?.toLowerCase()?.trim()
      const validPlans = ['team', 'business', 'enterprise']

      if (!plan || !validPlans.includes(plan)) {
        return false
      }

      // Verificar que la suscripción no haya expirado
      if (subscription.end_date) {
        const endDate = new Date(subscription.end_date)
        const now = new Date()

        if (endDate < now) {
          return false
        }
      }

      return true
    } catch (error) {
      techDebtLogger.error('Error checking subscription table:', error)
      return false
    }
  }

  /**
   * Calcula el período de facturación actual basado en subscription_start_date y billing_cycle
   */
  static calculateBillingPeriod(
    subscriptionStartDate: string | null,
    billingCycle: 'monthly' | 'yearly' | null,
  ): { start: Date; end: Date } | null {
    if (!subscriptionStartDate || !billingCycle) {
      return null
    }

    const startDate = new Date(subscriptionStartDate)
    const now = new Date()

    // Calcular cuántos períodos han pasado desde el inicio
    let periodsPassed = 0
    if (billingCycle === 'monthly') {
      const monthsDiff =
        (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth())
      periodsPassed = Math.floor(monthsDiff)
    } else {
      // yearly
      const yearsDiff = now.getFullYear() - startDate.getFullYear()
      periodsPassed = Math.floor(yearsDiff)
    }

    // Calcular el inicio del período actual
    const currentPeriodStart = new Date(startDate)
    if (billingCycle === 'monthly') {
      currentPeriodStart.setMonth(startDate.getMonth() + periodsPassed)
    } else {
      currentPeriodStart.setFullYear(startDate.getFullYear() + periodsPassed)
    }

    // Calcular el fin del período actual
    const currentPeriodEnd = new Date(currentPeriodStart)
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + 1)
    } else {
      currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1)
    }

    return {
      start: currentPeriodStart,
      end: currentPeriodEnd,
    }
  }

  /**
   * Cuenta cursos comprados por la organización en el período de facturación actual
   */
  static async getOrganizationMonthlyCourseCount(
    organizationId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
  ): Promise<number> {
    try {
      const supabase = createAdminClient()

      const { count, error } = await supabase
        .from('organization_course_purchases')
        .select('purchase_id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('access_status', 'active')
        .gte('purchased_at', billingPeriodStart.toISOString())
        .lt('purchased_at', billingPeriodEnd.toISOString())

      if (error) {
        techDebtLogger.error('Error counting organization courses:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      techDebtLogger.error('Error in getOrganizationMonthlyCourseCount:', error)
      return 0
    }
  }

  /**
   * Verifica si la organización puede comprar más cursos (dentro del límite de 10 por período)
   */
  static async canOrganizationPurchaseCourse(
    organizationId: string,
    maxCourses: number = 10,
  ): Promise<{
    canPurchase: boolean
    currentCount: number
    maxCourses: number
    billingPeriod: { start: Date; end: Date } | null
  }> {
    try {
      const supabase = createAdminClient()

      // Obtener información de la organización
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_start_date, billing_cycle')
        .eq('id', organizationId)
        .single()

      if (orgError || !organization) {
        return {
          canPurchase: false,
          currentCount: 0,
          maxCourses,
          billingPeriod: null,
        }
      }

      // Calcular período de facturación actual
      const billingPeriod = this.calculateBillingPeriod(
        organization.subscription_start_date,
        organization.billing_cycle as 'monthly' | 'yearly' | null,
      )

      if (!billingPeriod) {
        return {
          canPurchase: false,
          currentCount: 0,
          maxCourses,
          billingPeriod: null,
        }
      }

      // Contar cursos comprados en el período actual
      const currentCount = await this.getOrganizationMonthlyCourseCount(
        organizationId,
        billingPeriod.start,
        billingPeriod.end,
      )

      return {
        canPurchase: currentCount < maxCourses,
        currentCount,
        maxCourses,
        billingPeriod,
      }
    } catch (error) {
      techDebtLogger.error('Error in canOrganizationPurchaseCourse:', error)
      return {
        canPurchase: false,
        currentCount: 0,
        maxCourses,
        billingPeriod: null,
      }
    }
  }
}
