import { createClient } from '../../../lib/supabase/server'
import {
  createEmptyUserStats,
  mapSubscriptionRecord,
  mapUserProfileRow,
  pickAllowedProfileUpdates,
  resolveChangedProfileFields
} from './profile.shared'
import type { UpdateProfileRequest, UserProfile, UserSubscription } from '../types/profile.types'

export class ProfileServerService {
  static async getProfile(userId: string): Promise<UserProfile> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Error al obtener perfil: ${error.message}`)
    }

    if (!data) {
      throw new Error('Perfil no encontrado')
    }

    return mapUserProfileRow(data)
  }

  static async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<UserProfile> {
    const supabase = await createClient()

    const { data: oldData, error: oldDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (oldDataError) {
      throw new Error(`Error al obtener perfil actual: ${oldDataError.message}`)
    }

    if (!oldData) {
      throw new Error('Perfil no encontrado')
    }

    const safeUpdates = pickAllowedProfileUpdates(updates)
    const actualChanges = resolveChangedProfileFields(oldData, safeUpdates)

    if (actualChanges.length === 0) {
      return mapUserProfileRow(oldData)
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString()
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

    try {
      const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')
      await AutoNotificationsService.notifyProfileUpdated(userId, actualChanges, {
        timestamp: new Date().toISOString()
      })
    } catch {
      // Best effort: la actualización principal ya se completó.
    }

    return mapUserProfileRow(data)
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
