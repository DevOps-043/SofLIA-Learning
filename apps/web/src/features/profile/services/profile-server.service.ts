import { createClient } from '../../../lib/supabase/server'

export interface UserProfile {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone: string
  bio: string
  location: string
  cargo_rol: string
  type_rol: string
  profile_picture_url: string
  curriculum_url: string
  linkedin_url: string
  github_url: string
  website_url: string
  country_code: string
  points: number
  created_at: string
  last_login_at: string
  email_verified: boolean
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  phone?: string
  bio?: string
  location?: string
  cargo_rol?: string
  type_rol?: string
  profile_picture_url?: string
  curriculum_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  country_code?: string
}

export class ProfileServerService {
  static async getProfile(userId: string): Promise<UserProfile> {
    try {
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

      return {
        id: data.id,
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        cargo_rol: data.cargo_rol || '',
        type_rol: data.type_rol || '',
        profile_picture_url: data.profile_picture_url || '',
        curriculum_url: '', // Removed from schema
        linkedin_url: '', // Removed from schema
        github_url: '', // Removed from schema
        website_url: '', // Removed from schema
        country_code: data.country_code || '',
        points: data.points || 0,
        created_at: data.created_at,
        last_login_at: data.last_login_at || data.created_at,
        email_verified: data.email_verified || false
      }
    } catch (error) {
      throw error
    }
  }

  static async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const supabase = await createClient()

      // Obtener datos anteriores para comparar
      const { data: oldData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Filtrar solo los campos permitidos para actualización
      const allowedFields: (keyof UpdateProfileRequest)[] = [
        'username', 'first_name', 'last_name', 'display_name',
        'phone', 'bio', 'location', 'cargo_rol', 'type_rol',
        'profile_picture_url', 'country_code'
        // Nota: 'curriculum_url', 'linkedin_url', 'github_url', 'website_url' 
        // fueron removidos de la tabla `users` en la nueva optimización.
        // Nota: 'email' se excluye por defecto aquí ya que el cambio de email 
        // suele requerir confirmación o flujo de auth. Si se desea permitir, agregarlo.
        // Por seguridad, evitamos actualizar 'email' directamente en la tabla users
        // si no estamos seguros de la sincronización con auth.users.
      ]

      const safeUpdates: any = {}

      // Solo copiar campos definidos y permitidos
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          safeUpdates[field] = updates[field]
        }
      })

      // Si también queremos permitir actualizar el email (con cuidado)
      if (updates.email && updates.email !== oldData?.email) {
        // Por ahora lo permitimos si la lógica de negocio lo soporta, 
        // pero idealmente esto debería ir por supabase.auth.updateUser()
        // safeUpdates.email = updates.email
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
        console.error('--- Supabase Update No Data ---')
        throw new Error('Error al actualizar perfil')
      }

      // Crear notificación de actualización de perfil
      // Solo incluir campos que realmente cambiaron (comparar valores anteriores vs nuevos)
      try {
        const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')

        // Comparar valores anteriores vs nuevos para detectar cambios reales
        const actualChanges: string[] = []
        if (oldData) {
          for (const [key, newValue] of Object.entries(updates)) {
            const oldValue = oldData[key as keyof typeof oldData]
            // Comparar valores (convertir a string para comparación segura)
            if (String(oldValue || '') !== String(newValue || '')) {
              actualChanges.push(key)
            }
          }
        } else {
          // Si no hay datos anteriores, usar todas las claves de updates
          actualChanges.push(...Object.keys(updates))
        }

        await AutoNotificationsService.notifyProfileUpdated(userId, actualChanges, {
          timestamp: new Date().toISOString()
        })
      } catch (notificationError) {
        // No lanzar error para no afectar el flujo principal
      }

      return {
        id: data.id,
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        cargo_rol: data.cargo_rol || '',
        type_rol: data.type_rol || '',
        profile_picture_url: data.profile_picture_url || '',
        curriculum_url: data.curriculum_url || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        website_url: data.website_url || '',
        country_code: data.country_code || '',
        points: data.points || 0,
        created_at: data.created_at,
        last_login_at: data.last_login_at || data.created_at,
        email_verified: data.email_verified || false
      }
    } catch (error) {
      throw error
    }
  }

  static async getUserStats(userId: string): Promise<{
    completedCourses: number
    completedLessons: number
    certificates: number
    coursesInProgress: number
  }> {
    try {
      const supabase = await createClient()

      // Obtener cursos completados
      const { count: completedCount, error: completedError } = await supabase
        .from('user_course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('enrollment_status', 'completed')

      if (completedError) {
      }

      // Obtener lecciones completadas
      const { count: completedLessonsCount, error: lessonsError } = await supabase
        .from('user_lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true)

      if (lessonsError) {
      }

      // Obtener certificados obtenidos
      const { count: certificatesCount, error: certificatesError } = await supabase
        .from('user_course_certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (certificatesError) {
      }

      // Obtener cursos en progreso
      const { count: inProgressCount, error: inProgressError } = await supabase
        .from('user_course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('enrollment_status', 'active')

      if (inProgressError) {
      }

      return {
        completedCourses: completedCount || 0,
        completedLessons: completedLessonsCount || 0,
        certificates: certificatesCount || 0,
        coursesInProgress: inProgressCount || 0
      }
    } catch (error) {
      // Retornar valores por defecto en caso de error
      return {
        completedCourses: 0,
        completedLessons: 0,
        certificates: 0,
        coursesInProgress: 0
      }
    }
  }

  static async getUserSubscriptions(userId: string): Promise<Array<{
    subscription_id: string
    subscription_type: string
    subscription_status: string
    price_cents: number
    start_date: string
    end_date: string | null
    next_billing_date: string | null
    course_id: string | null
    course_title?: string
  }>> {
    try {
      const supabase = await createClient()

      // Obtener suscripciones del usuario con información del curso si existe
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

      if (error) {
        return []
      }

      if (!subscriptions || subscriptions.length === 0) {
        return []
      }

      // Formatear los datos
      return subscriptions.map((sub: any) => ({
        subscription_id: sub.subscription_id,
        subscription_type: sub.subscription_type,
        subscription_status: sub.subscription_status,
        price_cents: sub.price_cents,
        start_date: sub.start_date,
        end_date: sub.end_date,
        next_billing_date: sub.next_billing_date,
        course_id: sub.course_id,
        course_title: sub.courses?.title || null
      }))
    } catch (error) {
      return []
    }
  }
}
