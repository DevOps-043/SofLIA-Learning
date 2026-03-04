import { createClient } from '../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/supabase/types'
import { AuditLogService } from './auditLog.service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Función helper para crear cliente con service role key (bypass RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
// Interface actualizada para reflejar la estructura actual de la tabla users
// La tabla ya no tiene: points, curriculum_url, linkedin_url, github_url, website_url, role_zoom
export interface AdminUser {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  cargo_rol: string
  type_rol: string | null
  email_verified: boolean
  email_verified_at: string | null
  phone: string | null
  bio: string | null
  location: string | null
  profile_picture_url: string | null
  country_code: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
  // Campos adicionales que existen en la BD
  oauth_provider?: string | null
  oauth_provider_id?: string | null
  is_banned?: boolean
  banned_at?: string | null
  ban_reason?: string | null
}

export interface UserStats {
  totalUsers: number
  verifiedUsers: number
  instructors: number
  administrators: number
}

export interface GetUsersOptions {
  page?: number
  limit?: number
  search?: string
}

export interface GetUsersResult {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}

export class AdminUsersService {
  static async getUsers(options: GetUsersOptions = {}): Promise<GetUsersResult> {
    const supabase = createAdminClient() // ✅ Usar cliente admin para bypass RLS
    const { page = 1, limit = 50, search } = options

    try {
      // 🚀 OPTIMIZACIÓN: Calcular offset para paginación
      const from = (page - 1) * limit
      const to = from + limit - 1

      // 🚀 OPTIMIZACIÓN: Solo seleccionar campos necesarios que EXISTEN en la tabla
      // NOTA: La columna 'points' fue eliminada de la tabla users
      let query = supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          cargo_rol,
          email_verified,
          profile_picture_url,
          created_at,
          updated_at,
          last_login_at
        `, { count: 'exact' })

      // 🚀 Aplicar búsqueda si se proporciona
      if (search && search.trim()) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,username.ilike.%${search}%`)
      }

      // 🚀 Aplicar paginación y ordenamiento
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('❌ Error fetching users:', error)
        throw error
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        users: data || [],
        total,
        page,
        totalPages
      }
    } catch (error) {
      console.error('💥 Error in AdminUsersService.getUsers:', error)
      throw error
    }
  }

  static async getUserStats(): Promise<UserStats> {
    const supabase = createAdminClient() // ✅ Usar cliente admin para bypass RLS

    try {
      // 🚀 OPTIMIZACIÓN: Usar queries agregadas en paralelo en lugar de filtrado en cliente
      // ANTES: 1 query grande + filtrado en cliente
      // DESPUÉS: 4 queries agregadas en paralelo (mucho más eficiente)

      const [totalResult, verifiedResult, instructorsResult, adminsResult] = await Promise.all([
        // Total de usuarios
        supabase.from('users').select('id', { count: 'exact', head: true }),

        // Usuarios verificados
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('email_verified', true),

        // Instructores
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('cargo_rol', 'Instructor'),

        // Administradores
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('cargo_rol', 'Administrador')
      ])

      // Verificar errores
      if (totalResult.error) throw totalResult.error
      if (verifiedResult.error) throw verifiedResult.error
      if (instructorsResult.error) throw instructorsResult.error
      if (adminsResult.error) throw adminsResult.error

      const stats: UserStats = {
        totalUsers: totalResult.count || 0,
        verifiedUsers: verifiedResult.count || 0,
        instructors: instructorsResult.count || 0,
        administrators: adminsResult.count || 0
      }

      return stats
    } catch (error) {
      console.error('Error in AdminUsersService.getUserStats:', error)
      throw error
    }
  }

  static async updateUser(userId: string, userData: Partial<AdminUser>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminUser> {
    const supabase = await createClient()

    try {
      // Obtener datos anteriores para el log de auditoría
      const { data: oldData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await supabase
        .from('users')
        .update({
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          display_name: userData.display_name,
          cargo_rol: userData.cargo_rol,
          type_rol: userData.type_rol,
          email_verified: userData.email_verified,
          email_verified_at: userData.email_verified ? new Date().toISOString() : userData.email_verified_at,
          phone: userData.phone,
          bio: userData.bio,
          location: userData.location,
          profile_picture_url: userData.profile_picture_url,
          country_code: userData.country_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          cargo_rol,
          type_rol,
          email_verified,
          email_verified_at,
          phone,
          bio,
          location,
          profile_picture_url,
          country_code,
          created_at,
          updated_at,
          last_login_at
        `)
        .single()

      if (error) {
        // console.error('Error updating user:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: userId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'users',
        record_id: userId,
        old_values: oldData,
        new_values: userData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      // console.error('Error in AdminUsersService.updateUser:', error)
      throw error
    }
  }

  static async updateUserRole(userId: string, newRole: string): Promise<void> {
    const supabase = await createClient()

    try {
      const { error } = await supabase
        .from('users')
        .update({ cargo_rol: newRole })
        .eq('id', userId)

      if (error) {
        // console.error('Error updating user role:', error)
        throw error
      }
    } catch (error) {
      // console.error('Error in AdminUsersService.updateUserRole:', error)
      throw error
    }
  }

  static async createUser(userData: any, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminUser> {
    const adminSupabase = createAdminClient()

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12)

      // Generar ID único
      const userId = crypto.randomUUID()

      // Crear el usuario
      const { data, error } = await adminSupabase
        .from('users')
        .insert({
          id: userId,
          username: userData.username,
          email: userData.email,
          password_hash: passwordHash,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          display_name: userData.display_name || null,
          cargo_rol: userData.cargo_rol,
          type_rol: userData.type_rol || null,
          phone: userData.phone || null,
          bio: userData.bio || null,
          location: userData.location || null,
          profile_picture_url: userData.profile_picture_url || null,
          country_code: userData.country_code || null,
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          cargo_rol,
          type_rol,
          email_verified,
          email_verified_at,
          phone,
          bio,
          location,
          profile_picture_url,
          country_code,
          created_at,
          updated_at,
          last_login_at
        `)
        .single()

      if (error) {
        // console.error('Error creating user:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: data.id,
        admin_user_id: adminUserId,
        action: 'CREATE',
        table_name: 'users',
        record_id: data.id,
        old_values: null,
        new_values: userData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      // console.error('Error in AdminUsersService.createUser:', error)
      throw error
    }
  }

  static async deleteUser(userId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()
    const adminSupabase = createAdminClient() // Cliente con service role key para bypass RLS

    try {
      // Obtener datos del usuario antes de eliminarlo para el log de auditoría
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Registrar en el log de auditoría ANTES de eliminar el usuario
      try {
        await AuditLogService.logAction({
          user_id: userId,
          admin_user_id: adminUserId,
          action: 'DELETE',
          table_name: 'users',
          record_id: userId,
          old_values: userData,
          new_values: null,
          ip_address: requestInfo?.ip,
          user_agent: requestInfo?.userAgent
        })
      } catch (auditError) {
        // No fallar la eliminación si el log de auditoría falla
      }

      console.log('🗑️ [AdminUsersService.deleteUser] Intentando eliminar usuario:', userId)

      // ============================================
      // INTENTO 1: Usar función RPC delete_user_cascade (más confiable)
      // ============================================
      console.log('🔄 Intentando eliminar via RPC delete_user_cascade...')
      const { data: rpcResult, error: rpcError } = await adminSupabase
        .rpc('delete_user_cascade', { target_user_id: userId })

      if (!rpcError) {
        console.log('✅ Usuario eliminado exitosamente via RPC:', rpcResult)
        return // Éxito - no necesitamos continuar
      }

      console.warn('⚠️ RPC delete_user_cascade falló, usando método manual:', rpcError.message)

      // ============================================
      // INTENTO 2: Método manual si RPC falla
      // ============================================
      console.log('🗑️ [AdminUsersService.deleteUser] Iniciando eliminación manual en cascada')

      // Helper function para eliminar de una tabla de forma segura
      const deleteFromTable = async (tableName: string, column: string = 'user_id') => {
        try {
          const { error } = await adminSupabase.from(tableName).delete().eq(column, userId)
          if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
            console.warn(`⚠️ Error eliminando de ${tableName}:`, error.message)
          }
        } catch (e) {
          console.warn(`⚠️ Excepción eliminando de ${tableName}:`, e)
        }
      }

      // ============================================
      // PASO 1: Eliminar datos dependientes primero (orden de dependencias)
      // ============================================

      // 1. LIA - Primero feedback, luego activity completions, luego conversaciones
      console.log('🔄 Eliminando datos de LIA...')
      await deleteFromTable('lia_user_feedback')
      await deleteFromTable('lia_activity_completions')
      await deleteFromTable('lia_conversations')

      // 2. CRÍTICO: Obtener enrollment_ids del usuario ANTES de eliminar dependencias
      console.log('🔄 Obteniendo enrollment IDs...')
      const { data: enrollments } = await adminSupabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)

      const enrollmentIds = enrollments?.map(e => e.enrollment_id) || []
      console.log(`📋 Encontrados ${enrollmentIds.length} enrollments para eliminar`)

      // 3. Eliminar tablas que dependen de enrollment_id PRIMERO
      if (enrollmentIds.length > 0) {
        console.log('🔄 Eliminando dependencias de enrollments...')

        // user_lesson_progress tiene FK a enrollment_id
        const { error: progErr } = await adminSupabase
          .from('user_lesson_progress')
          .delete()
          .in('enrollment_id', enrollmentIds)
        if (progErr) console.warn('⚠️ Error en user_lesson_progress:', progErr.message)

        // user_quiz_submissions tiene FK a enrollment_id
        const { error: quizErr } = await adminSupabase
          .from('user_quiz_submissions')
          .delete()
          .in('enrollment_id', enrollmentIds)
        if (quizErr) console.warn('⚠️ Error en user_quiz_submissions:', quizErr.message)

        // user_course_certificates tiene FK a enrollment_id
        // NOTA: certificate_ledger es append-only, NO intentar eliminar de ahí
        // Solo eliminar los certificados directamente
        console.log('🔄 Eliminando certificados (sin tocar ledger)...')
        const { error: certErr } = await adminSupabase
          .from('user_course_certificates')
          .delete()
          .in('enrollment_id', enrollmentIds)

        if (certErr) {
          console.warn('⚠️ Error inicial en user_course_certificates:', certErr.message)
          // Si falla, intentar por user_id
          const { error: certErr2 } = await adminSupabase
            .from('user_course_certificates')
            .delete()
            .eq('user_id', userId)
          if (certErr2) {
            console.error('❌ No se pueden eliminar certificados:', certErr2.message)
            // Intentar con SQL directo via RPC si existe
          }
        }
      }

      // 4. También eliminar certificados, quiz submissions y progress por user_id (por si acaso)
      console.log('🔄 Eliminando certificados por user_id...')
      await deleteFromTable('user_course_certificates')

      console.log('🔄 Eliminando quiz submissions por user_id...')
      await deleteFromTable('user_quiz_submissions')

      // 5. Progreso de lecciones y tracking
      console.log('🔄 Eliminando progreso...')
      await deleteFromTable('lesson_tracking')
      await deleteFromTable('user_lesson_progress')
      await deleteFromTable('daily_progress')

      // 6. Notas de lecciones
      console.log('🔄 Eliminando notas de lecciones...')
      await deleteFromTable('user_lesson_notes')

      // 7. Sesiones de estudio
      console.log('🔄 Eliminando sesiones de estudio...')
      await deleteFromTable('study_sessions')

      // 8. Calendar sync history
      console.log('🔄 Eliminando calendar sync...')
      await deleteFromTable('calendar_sync_history')

      // 9. Study plans
      console.log('🔄 Eliminando planes de estudio...')
      await deleteFromTable('study_plans')

      // 10. CRÍTICO: Eliminar enrollments - verificar que se eliminen
      console.log('🔄 Eliminando enrollments...')
      const { error: enrollError } = await adminSupabase
        .from('user_course_enrollments')
        .delete()
        .eq('user_id', userId)

      if (enrollError) {
        console.error('❌ Error crítico eliminando enrollments:', enrollError)
        // Intentar de nuevo después de limpiar más dependencias
      }

      // Verificar que los enrollments se eliminaron
      const { data: remainingEnrollments } = await adminSupabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)

      if (remainingEnrollments && remainingEnrollments.length > 0) {
        console.error(`❌ Aún quedan ${remainingEnrollments.length} enrollments sin eliminar`)
        // Forzar eliminación
        for (const enrollment of remainingEnrollments) {
          await adminSupabase
            .from('user_lesson_progress')
            .delete()
            .eq('enrollment_id', enrollment.enrollment_id)
          await adminSupabase
            .from('user_quiz_submissions')
            .delete()
            .eq('enrollment_id', enrollment.enrollment_id)
          await adminSupabase
            .from('user_course_certificates')
            .delete()
            .eq('enrollment_id', enrollment.enrollment_id)
        }
        // Intentar eliminar enrollments de nuevo
        await adminSupabase
          .from('user_course_enrollments')
          .delete()
          .eq('user_id', userId)
      }


      // 10. Asignaciones de cursos
      console.log('🔄 Eliminando asignaciones de cursos...')
      await deleteFromTable('organization_course_assignments')
      await deleteFromTable('organization_course_assignments', 'assigned_by')

      // 11. Preguntas, respuestas y reacciones de cursos
      console.log('🔄 Eliminando Q&A de cursos...')
      await deleteFromTable('course_question_reactions')
      await deleteFromTable('course_question_responses')
      await deleteFromTable('course_questions')
      await deleteFromTable('course_reviews')
      await deleteFromTable('lesson_feedback')

      // 12. Notificaciones y preferencias
      console.log('🔄 Eliminando notificaciones...')
      await deleteFromTable('notification_email_queue')
      await deleteFromTable('notification_push_subscriptions')
      await deleteFromTable('notification_stats')
      await deleteFromTable('user_notification_preferences')
      await deleteFromTable('user_notifications')

      // 13. Calendario
      console.log('🔄 Eliminando calendario...')
      await deleteFromTable('user_calendar_events')
      await deleteFromTable('calendar_subscription_tokens')
      await deleteFromTable('calendar_integrations')

      // 14. SCORM
      console.log('🔄 Eliminando SCORM...')
      const { data: scormAttempts } = await adminSupabase
        .from('scorm_attempts')
        .select('id')
        .eq('user_id', userId)

      if (scormAttempts && scormAttempts.length > 0) {
        const attemptIds = scormAttempts.map(a => a.id)
        await adminSupabase.from('scorm_interactions').delete().in('attempt_id', attemptIds)
        await adminSupabase.from('scorm_objectives').delete().in('attempt_id', attemptIds)
      }
      await deleteFromTable('scorm_attempts')

      // 15. Transacciones y pagos
      console.log('🔄 Eliminando transacciones...')
      await deleteFromTable('transactions')
      await deleteFromTable('subscriptions')
      await deleteFromTable('payment_methods')

      // 16. OAuth y autenticación
      console.log('🔄 Eliminando auth data...')
      await deleteFromTable('oauth_accounts')
      await deleteFromTable('password_reset_tokens')
      await deleteFromTable('refresh_tokens')
      await deleteFromTable('user_session')

      // 17. Work teams
      console.log('🔄 Eliminando datos de equipos...')
      await deleteFromTable('work_team_feedback', 'from_user_id')
      await deleteFromTable('work_team_feedback', 'to_user_id')
      await deleteFromTable('work_team_messages', 'sender_id')
      await deleteFromTable('work_team_objectives', 'created_by')
      await deleteFromTable('work_team_course_assignments', 'assigned_by')
      await deleteFromTable('work_team_members')
      // Actualizar work_teams donde el usuario es leader o creador
      await adminSupabase.from('work_teams').update({ team_leader_id: null }).eq('team_leader_id', userId)
      await adminSupabase.from('work_teams').update({ created_by: null }).eq('created_by', userId)

      // 18. User perfil y respuestas
      console.log('🔄 Eliminando perfil...')
      const { data: userPerfil } = await adminSupabase
        .from('user_perfil')
        .select('id')
        .eq('user_id', userId)

      if (userPerfil && userPerfil.length > 0) {
        const perfilIds = userPerfil.map(p => p.id)
        await adminSupabase.from('respuestas').delete().in('user_perfil_id', perfilIds)
      }
      await deleteFromTable('user_perfil')

      // 19. Reportes de problemas
      console.log('🔄 Eliminando reportes...')
      await deleteFromTable('reportes_problemas')
      await adminSupabase.from('reportes_problemas').update({ admin_asignado: null }).eq('admin_asignado', userId)

      // 20. Admin dashboard
      console.log('🔄 Eliminando admin dashboard data...')
      await deleteFromTable('admin_dashboard_layouts')
      await deleteFromTable('admin_dashboard_preferences')

      // 21. Study preferences y streaks
      console.log('🔄 Eliminando preferencias de estudio...')
      await deleteFromTable('study_preferences')
      await deleteFromTable('user_streaks')

      // 22. Activity logs
      console.log('🔄 Eliminando activity logs...')
      await deleteFromTable('user_activity_log')

      // 23. Progreso de tours
      console.log('🔄 Eliminando tour progress...')
      await deleteFromTable('user_tour_progress')

      // 24. Warnings y moderación
      console.log('🔄 Eliminando warnings y moderación...')
      await deleteFromTable('user_warnings')
      await deleteFromTable('ai_moderation_logs')

      // 25. Audit logs
      console.log('🔄 Eliminando audit logs...')
      await deleteFromTable('audit_logs')
      await deleteFromTable('audit_logs', 'admin_user_id')

      // 26. Datos adicionales
      console.log('🔄 Eliminando datos adicionales...')
      await deleteFromTable('user_favorites')
      await deleteFromTable('app_favorites')
      await deleteFromTable('notes')

      // 27. Comunidad - Obtener posts primero para limpiar dependencias
      console.log('🔄 Eliminando datos de comunidad...')
      const { data: userPosts } = await adminSupabase
        .from('community_posts')
        .select('id')
        .eq('user_id', userId)
      const postIds = userPosts?.map(post => post.id) || []

      // Comentarios y reacciones en posts del usuario
      if (postIds.length > 0) {
        await adminSupabase.from('community_comments').delete().in('post_id', postIds)
        await adminSupabase.from('community_reactions').delete().in('post_id', postIds)
        await adminSupabase.from('community_post_reactions').delete().in('post_id', postIds)
      }

      // Reacciones y comentarios creados por el usuario
      await deleteFromTable('community_reactions')
      await deleteFromTable('community_post_reactions')
      await deleteFromTable('community_comment_reactions')
      await deleteFromTable('community_comments')
      await deleteFromTable('community_posts')
      await deleteFromTable('community_members')
      await deleteFromTable('community_access_requests', 'requester_id')
      await adminSupabase.from('community_access_requests').update({ reviewed_by: null }).eq('reviewed_by', userId)

      // 28. Organization hierarchy nodes
      console.log('🔄 Eliminando datos de nodos jerárquicos...')
      await deleteFromTable('organization_node_users')
      await adminSupabase.from('organization_nodes').update({ manager_id: null }).eq('manager_id', userId)

      // 29. Organization users
      console.log('🔄 Eliminando de organization_users...')
      await adminSupabase.from('organization_users').update({ invited_by: null }).eq('invited_by', userId)
      await deleteFromTable('organization_users')

      // 29. Compras de cursos de organización
      console.log('🔄 Eliminando compras de cursos...')
      await deleteFromTable('organization_course_purchases', 'purchased_by')

      // 30. Manejar referencias como instructor en lecciones
      // NOTA: instructor_id es NOT NULL en course_lessons, por lo que debemos ELIMINAR las lecciones
      // Primero eliminamos todas las referencias a esas lecciones
      console.log('🔄 Obteniendo lecciones donde el usuario es instructor...')

      const { data: userLessons, error: fetchLessonsError } = await adminSupabase
        .from('course_lessons')
        .select('lesson_id')
        .eq('instructor_id', userId)

      if (fetchLessonsError) {
        console.error('❌ Error obteniendo lecciones:', fetchLessonsError)
      }

      const lessonIds = userLessons?.map(lesson => lesson.lesson_id) || []
      console.log(`📋 Encontradas ${lessonIds.length} lecciones con instructor_id=${userId}`)

      if (lessonIds.length > 0) {
        console.log('🔄 Eliminando referencias a lecciones...')

        // Eliminar todas las referencias a estas lecciones
        await adminSupabase.from('lesson_activities').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lesson_materials').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lesson_checkpoints').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lesson_time_estimates').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lesson_feedback').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('user_lesson_progress').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lesson_tracking').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lia_common_questions').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lesson_notes').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('lia_conversations').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('study_sessions').delete().in('lesson_id', lessonIds)
        await adminSupabase.from('user_activity_log').delete().in('lesson_id', lessonIds)

        console.log('✅ Referencias a lecciones eliminadas')

        // Ahora eliminar las lecciones
        console.log('🔄 Eliminando lecciones donde el usuario es instructor...')

        const { error: deleteLessonsError } = await adminSupabase
          .from('course_lessons')
          .delete()
          .eq('instructor_id', userId)

        if (deleteLessonsError) {
          console.error('❌ Error eliminando course_lessons:', deleteLessonsError)
        } else {
          console.log('✅ course_lessons eliminadas correctamente')
        }

        // También eliminar de tablas de traducciones
        await adminSupabase.from('course_lessons_en').delete().eq('instructor_id', userId)
        await adminSupabase.from('course_lessons_pt').delete().eq('instructor_id', userId)
      }

      // Actualizar cursos donde es instructor o approved_by
      await adminSupabase.from('courses').update({ instructor_id: null }).eq('instructor_id', userId)
      await adminSupabase.from('courses').update({ approved_by: null }).eq('approved_by', userId)

      // Actualizar news
      await adminSupabase.from('news').update({ created_by: null }).eq('created_by', userId)

      // Actualizar content_translations
      await adminSupabase.from('content_translations').update({ created_by: null }).eq('created_by', userId)

      // Actualizar scorm_packages
      await adminSupabase.from('scorm_packages').update({ created_by: null }).eq('created_by', userId)

      console.log('✅ [AdminUsersService.deleteUser] Todos los datos relacionados eliminados')

      // ============================================
      // PASO FINAL: Eliminar el usuario
      // ============================================
      console.log('🔄 Eliminando usuario de la tabla users...')
      const { error } = await adminSupabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('❌ Error eliminando usuario:', error)
        throw error
      }

      console.log('✅ [AdminUsersService.deleteUser] Usuario eliminado completamente:', userId)
    } catch (error) {
      console.error('❌ Error in AdminUsersService.deleteUser:', error)
      throw error
    }
  }
}

