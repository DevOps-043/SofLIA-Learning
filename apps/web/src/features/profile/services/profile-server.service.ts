import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'
import { resolveUserPrimaryMembership } from '../../../lib/services/user-org-context.service'
import {
  createEmptyUserStats,
  mapSubscriptionRecord,
  mapUserProfileRow,
  pickAllowedOrganizationProfileUpdates,
  pickAllowedProfileUpdates,
  resolveChangedOrganizationProfileFields,
  resolveChangedProfileFields
} from './profile.shared'
import type { UpdateProfileRequest, UserProfile, UserSubscription } from '../types/profile.types'

export class ProfileServerService {
  static async getProfile(userId: string, organizationId?: string | null): Promise<UserProfile> {
    const supabase = await createClient()

    const [profileResult, membership] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),
      resolveUserPrimaryMembership(supabase, userId, organizationId)
    ])

    const { data, error } = profileResult

    if (error) {
      throw new Error(`Error al obtener perfil: ${error.message}`)
    }

    if (!data) {
      throw new Error('Perfil no encontrado')
    }

    return mapUserProfileRow({
      ...data,
      job_title: membership?.job_title ?? null,
      job_description: membership?.job_description ?? null
    })
  }

  static async updateProfile(userId: string, updates: UpdateProfileRequest, organizationId?: string | null): Promise<UserProfile> {
    const supabase = await createClient()

    const [oldProfileResult, oldMembership] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),
      resolveUserPrimaryMembership(supabase, userId, organizationId)
    ])

    const { data: oldData, error: oldDataError } = oldProfileResult

    if (oldDataError) {
      throw new Error(`Error al obtener perfil actual: ${oldDataError.message}`)
    }

    if (!oldData) {
      throw new Error('Perfil no encontrado')
    }

    const safeUpdates = pickAllowedProfileUpdates(updates)
    const organizationUpdates = pickAllowedOrganizationProfileUpdates(updates)
    const actualChanges = resolveChangedProfileFields(oldData, safeUpdates)
    const organizationChanges = resolveChangedOrganizationProfileFields(oldMembership, organizationUpdates)

    if (actualChanges.length === 0 && organizationChanges.length === 0) {
      return mapUserProfileRow({
        ...oldData,
        job_title: oldMembership?.job_title ?? null,
        job_description: oldMembership?.job_description ?? null
      })
    }

    let nextProfile = oldData
    let nextMembership: { id: string; job_title: string | null; job_description: string | null } | null = oldMembership
    const now = new Date().toISOString()

    if (actualChanges.length > 0) {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...safeUpdates,
          updated_at: now
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Error al actualizar perfil: ${error.message}`)
      }

      if (!data) {
        throw new Error('Error al actualizar perfil')
      }

      nextProfile = data
    }

    if (organizationChanges.length > 0) {
      if (!oldMembership?.id) {
        throw new Error('No se encontró una membresía activa para actualizar el rol laboral')
      }

      const { data, error } = await supabase
        .from('organization_users')
        .update({
          ...organizationUpdates,
          updated_at: now
        })
        .eq('id', oldMembership.id)
        .eq('user_id', userId)
        .select('id, job_title, job_description')
        .single()

      if (error) {
        throw new Error(`Error al actualizar datos laborales: ${error.message}`)
      }

      nextMembership = data as { id: string; job_title: string | null; job_description: string | null } | null
    }

    try {
      const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')
      await AutoNotificationsService.notifyProfileUpdated(userId, [...actualChanges, ...organizationChanges], {
        timestamp: new Date().toISOString()
      })
    } catch {
      // Best effort: la actualización principal ya se completó.
    }

    return mapUserProfileRow({
      ...nextProfile,
      job_title: nextMembership?.job_title ?? null,
      job_description: nextMembership?.job_description ?? null
    })
  }

  static async getUserStats(userId: string): Promise<{
    completedCourses: number
    completedLessons: number
    certificates: number
    coursesInProgress: number
  }> {
    try {
      const supabase = await createClient()

      const [completedCoursesResult, completedLessonsResult, certificatesResult, coursesInProgressResult] = await Promise.all([
        supabase
          .from('user_course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('enrollment_status', 'completed'),
        supabase
          .from('user_lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_completed', true),
        supabase
          .from('user_course_certificates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('user_course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('enrollment_status', 'active')
      ])

      return {
        completedCourses: completedCoursesResult.count || 0,
        completedLessons: completedLessonsResult.count || 0,
        certificates: certificatesResult.count || 0,
        coursesInProgress: coursesInProgressResult.count || 0
      }
    } catch {
      return createEmptyUserStats()
    }
  }

  static async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    try {
      const supabase = await createClient()

      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          subscription_id,
          subscription_type,
          subscription_status,
          price_cents,
          start_date,
          end_date,
          next_billing_date,
          course_id,
          courses:course_id (
            title
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error || !subscriptions?.length) {
        return []
      }

      return subscriptions.map(record => mapSubscriptionRecord(record))
    } catch {
      return []
    }
  }
}
