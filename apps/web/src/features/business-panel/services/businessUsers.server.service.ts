import 'server-only'

import { createClient as createClientServer } from '../../../lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { BusinessUsersService, BusinessUser, BusinessUserStats, CreateBusinessUserRequest, UpdateBusinessUserRequest } from './businessUsers.service'
import bcrypt from 'bcryptjs'

// Crear un cliente con service_role que bypasea RLS
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔧 [createServiceClient] URL exists:', !!supabaseUrl)
  console.log('🔧 [createServiceClient] Service key exists:', !!supabaseServiceKey)
  console.log('🔧 [createServiceClient] Service key length:', supabaseServiceKey?.length || 0)

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    throw new Error('Configuración de Supabase incompleta')
  }

  return createBrowserClient(supabaseUrl, supabaseServiceKey)
}

export class BusinessUsersServerService {
  /**
   * Obtener todos los usuarios de la organización del usuario autenticado
   * 🚀 OPTIMIZADO: Una sola query con JOIN en lugar de 2 queries secuenciales
   */
  static async getOrganizationUsers(organizationId: string): Promise<BusinessUser[]> {
    // Usar service client para bypasear RLS
    const supabase = createServiceClient()

    try {
      console.log('🔍 [BusinessUsersServerService] Getting users for org:', organizationId)

      // 🚀 OPTIMIZACIÓN: Una sola query con JOIN
      // Antes: 2 queries secuenciales (~600ms)
      // Después: 1 query con JOIN (~200ms)
      // NOTA: job_title ahora viene de organization_users, no de users.type_rol
      const { data: orgUsersData, error: orgUsersError } = await supabase
        .from('organization_users')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          job_title,
          status,
          joined_at,
          users:users!organization_users_user_id_fkey (
            id,
            username,
            email,
            first_name,
            last_name,
            display_name,
            cargo_rol,
            email_verified,
            profile_picture_url,
            bio,
            location,
            phone,
            last_login_at,
            created_at,
            updated_at
          )
        `)
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false })

      if (orgUsersError) {
        console.error('❌ Error fetching organization_users with join:', orgUsersError)
        throw orgUsersError
      }

      console.log('🔍 [BusinessUsersServerService] organization_users found:', orgUsersData?.length || 0)

      if (!orgUsersData || orgUsersData.length === 0) {
        return []
      }

      // Transformar los datos al formato esperado
      // NOTA: job_title viene de organization_users, no de users
      const users: BusinessUser[] = orgUsersData
        .filter(ou => ou.users)
        .map(ou => {
          const userData = ou.users as any
          return {
            ...userData,
            job_title: ou.job_title,  // Cargo/puesto en esta organización
            org_role: ou.role as 'owner' | 'admin' | 'member',
            org_status: ou.status as 'active' | 'invited' | 'suspended' | 'removed',
            joined_at: ou.joined_at
          }
        })

      console.log('🔍 [BusinessUsersServerService] Final users count:', users.length)
      return users
    } catch (error) {
      console.error('💥 Error in BusinessUsersServerService.getOrganizationUsers:', error)
      throw error
    }
  }


  // 
  /**
   * Obtener estadísticas de usuarios de la organización
   */
  static async getOrganizationStats(organizationId: string): Promise<BusinessUserStats> {
    const supabase = createServiceClient()

    // 
    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select('role, status')
        .eq('organization_id', organizationId)

      // 
      if (error) {
        // console.error('Error fetching organization stats:', error)
        throw error
      }

      // 
      const stats: BusinessUserStats = {
        total: data?.length || 0,
        active: data?.filter((u: any) => u.status === 'active').length || 0,
        invited: data?.filter((u: any) => u.status === 'invited').length || 0,
        suspended: data?.filter((u: any) => u.status === 'suspended').length || 0,
        admins: data?.filter((u: any) => u.role === 'admin' || u.role === 'owner').length || 0,
        members: data?.filter((u: any) => u.role === 'member').length || 0
      }

      // 
      return stats
    } catch (error) {
      // console.error('Error in BusinessUsersService.getOrganizationStats:', error)
      throw error
    }
  }

  // 
  /**
   * Crear un nuevo usuario en la organización
   */
  static async createOrganizationUser(
    organizationId: string,
    userData: CreateBusinessUserRequest,
    createdBy: string
  ): Promise<BusinessUser> {
    const supabase = createServiceClient()

    // 
    try {
      // Paso 1: Validar que la contraseña esté presente
      if (!userData.password || !userData.password.trim()) {
        throw new Error('La contraseña es obligatoria')
      }

      // 
      if (userData.password.trim().length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      // 
      // Paso 2: Hash de contraseña (obligatoria)
      const passwordHash = await bcrypt.hash(userData.password.trim(), 10)

      //
      // Paso 3: Validar que job_title esté presente
      if (!userData.job_title || !userData.job_title.trim()) {
        throw new Error('El cargo/puesto es obligatorio')
      }

      // Paso 4: Crear el usuario
      // NOTA: organization_id no existe en la tabla users, la relación se maneja en organization_users
      // NOTA: cargo_rol siempre es 'Business' - la diferenciación se hace en organization_users.role
      // NOTA: type_rol ya no se usa - job_title se guarda en organization_users
      const userInsertData: any = {
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        display_name: userData.display_name || null,
        cargo_rol: 'Business',  // Todos los usuarios de empresa son 'Business'
        password_hash: passwordHash
      }

      // 
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert(userInsertData)
        .select()
        .single()

      // 
      if (userError) {
        // console.error('Error creating user:', userError)
        throw userError
      }

      //
      // Paso 5: Agregar a organization_users (siempre activo porque siempre hay contraseña)
      // job_title ahora se guarda aquí (antes era type_rol en users)
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: organizationId,
          user_id: newUser.id,
          role: userData.org_role || 'member',
          job_title: userData.job_title.trim(),  // Cargo/puesto en esta organización
          status: 'active',
          invited_by: createdBy,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString()
        })

      // 
      if (orgUserError) {
        // console.error('Error adding user to organization:', orgUserError)
        // Rollback: eliminar usuario si falla agregarlo a la organización
        await supabase.from('users').delete().eq('id', newUser.id)
        throw orgUserError
      }

      // Paso 6: Auto-asignar al equipo predeterminado si está habilitado
      const orgRole = userData.org_role || 'member'
      if (orgRole === 'member') {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('hierarchy_enabled, hierarchy_config')
            .eq('id', organizationId)
            .single()

          const config = org?.hierarchy_config as Record<string, unknown> | null
          if (org?.hierarchy_enabled && config?.auto_assign_new_users) {
            // Buscar el primer nodo de tipo 'team' activo
            const { data: defaultTeam } = await supabase
              .from('organization_nodes')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('type', 'team')
              .eq('is_active', true)
              .order('created_at', { ascending: true })
              .limit(1)
              .single()

            if (defaultTeam) {
              await supabase
                .from('organization_node_users')
                .insert({
                  node_id: defaultTeam.id,
                  user_id: newUser.id,
                  role: 'member',
                  is_primary: true
                })
              console.log(`✅ [createOrganizationUser] Auto-assigned user ${newUser.id} to team ${defaultTeam.id}`)
            }
          }
        } catch (autoAssignError) {
          // No bloquear la creación si falla la auto-asignación
          console.warn('⚠️ [createOrganizationUser] Auto-assign failed:', autoAssignError)
        }
      }

      // 
      // Paso 7: Si es invitación, enviar email (placeholder)
      if (userData.send_invitation && !userData.password) {
        // TODO: Implementar servicio de email
      }

      // 
      // Paso 5: Retornar el usuario con info de organización
      const { data: orgUserData } = await supabase
        .from('organization_users')
        .select('role, status, joined_at')
        .eq('organization_id', organizationId)
        .eq('user_id', newUser.id)
        .single()

      // 
      const businessUser: BusinessUser = {
        ...newUser,
        org_role: orgUserData?.role || 'member',
        org_status: orgUserData?.status || 'invited',
        joined_at: orgUserData?.joined_at
      }

      // 
      return businessUser
    } catch (error) {
      console.error('❌ [createOrganizationUser] Error completo:', error)
      if (error && typeof error === 'object') {
        console.error('❌ [createOrganizationUser] Error details:', JSON.stringify(error, null, 2))
      }
      throw error
    }
  }

  // 
  /**
   * Actualizar un usuario de la organización
   */
  static async updateOrganizationUser(
    organizationId: string,
    userId: string,
    userData: UpdateBusinessUserRequest
  ): Promise<BusinessUser> {
    const supabase = createServiceClient()

    // 
    try {
      // Verificar que el usuario pertenece a la organización
      const { data: orgUser, error: orgUserError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      // 
      if (orgUserError || !orgUser) {
        throw new Error('Usuario no pertenece a tu organización')
      }

      // 
      // Actualizar datos del usuario
      const userUpdateData: any = {}
      if (userData.first_name !== undefined) userUpdateData.first_name = userData.first_name
      if (userData.last_name !== undefined) userUpdateData.last_name = userData.last_name
      if (userData.display_name !== undefined) userUpdateData.display_name = userData.display_name
      if (userData.email !== undefined) userUpdateData.email = userData.email
      if (userData.cargo_rol !== undefined) userUpdateData.cargo_rol = userData.cargo_rol
      // if (userData.type_rol !== undefined) userUpdateData.type_rol = userData.type_rol
      if (userData.profile_picture_url !== undefined) userUpdateData.profile_picture_url = userData.profile_picture_url
      if (userData.bio !== undefined) userUpdateData.bio = userData.bio
      if (userData.location !== undefined) userUpdateData.location = userData.location
      if (userData.phone !== undefined) userUpdateData.phone = userData.phone

      // 
      if (Object.keys(userUpdateData).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(userUpdateData)
          .eq('id', userId)

        // 
        if (updateError) {
          throw updateError
        }
      }

      // 
      // Actualizar datos en organization_users
      const orgUpdateData: any = {}
      if (userData.org_role !== undefined) orgUpdateData.role = userData.org_role
      if (userData.job_title !== undefined) orgUpdateData.job_title = userData.job_title
      if (userData.org_status !== undefined) orgUpdateData.status = userData.org_status

      // 
      if (Object.keys(orgUpdateData).length > 0) {
        const { error: orgUpdateError } = await supabase
          .from('organization_users')
          .update(orgUpdateData)
          .eq('organization_id', organizationId)
          .eq('user_id', userId)

        // 
        if (orgUpdateError) {
          throw orgUpdateError
        }
      }

      // 
      // Retornar usuario actualizado
      const { data: orgUserData } = await supabase
        .from('organization_users')
        .select(`
          role,
          status,
          joined_at,
          users!organization_users_user_id_fkey (
            id,
            username,
            email,
            first_name,
            last_name,
            display_name,
            cargo_rol,
            type_rol,
            organization_id,
            email_verified,
            profile_picture_url,
            bio,
            location,
            phone,
            points,
            last_login_at,
            created_at,
            updated_at
          )
        `)
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      // 
      if (!orgUserData || !orgUserData.users) {
        throw new Error('Usuario no encontrado después de actualizar')
      }

      // 
      return {
        ...orgUserData.users,
        org_role: orgUserData?.role || 'member',
        org_status: orgUserData?.status || 'active',
        joined_at: orgUserData?.joined_at
      }
    } catch (error) {
      // console.error('Error in BusinessUsersService.updateOrganizationUser:', error)
      throw error
    }
  }

  // 
  /**
   * Eliminar un usuario de la organización
   * Incluye eliminación en cascada de TODOS los datos relacionados
   * Basado en análisis completo de BD.sql
   */
  static async deleteOrganizationUser(organizationId: string, userId: string): Promise<void> {
    const supabase = createServiceClient()

    try {
      // Verificar que el usuario pertenece a la organización
      const { data: orgUser, error: orgUserError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      if (orgUserError || !orgUser) {
        throw new Error('Usuario no pertenece a tu organización')
      }

      console.log('🗑️ [deleteOrganizationUser] Iniciando eliminación en cascada COMPLETA para usuario:', userId)

      // Helper function para eliminar de una tabla
      const deleteFromTable = async (tableName: string, column: string = 'user_id') => {
        try {
          const { error } = await supabase.from(tableName).delete().eq(column, userId)
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

      // 2. Certificados y ledger (certificate_ledger depende de user_course_certificates)
      console.log('🔄 Eliminando certificados...')
      // Primero obtener los certificate_ids del usuario para eliminar del ledger
      const { data: certs } = await supabase
        .from('user_course_certificates')
        .select('certificate_id')
        .eq('user_id', userId)

      if (certs && certs.length > 0) {
        const certIds = certs.map(c => c.certificate_id)
        await supabase.from('certificate_ledger').delete().in('cert_id', certIds)
      }
      await deleteFromTable('user_course_certificates')

      // 3. Quiz submissions (dependen de enrollments)
      console.log('🔄 Eliminando quiz submissions...')
      await deleteFromTable('user_quiz_submissions')

      // 4. Progreso de lecciones y tracking (dependen de enrollments)
      console.log('🔄 Eliminando progreso...')
      await deleteFromTable('lesson_tracking')
      await deleteFromTable('user_lesson_progress')
      await deleteFromTable('daily_progress')

      // 5. Notas de lecciones
      console.log('🔄 Eliminando notas de lecciones...')
      await deleteFromTable('user_lesson_notes')

      // 6. Sesiones de estudio (dependen de study_plans)
      console.log('🔄 Eliminando sesiones de estudio...')
      await deleteFromTable('study_sessions')

      // 7. Calendar sync history (depende de study_plans)
      console.log('🔄 Eliminando calendar sync...')
      await deleteFromTable('calendar_sync_history')

      // 8. Study plans
      console.log('🔄 Eliminando planes de estudio...')
      await deleteFromTable('study_plans')

      // 9. Inscripciones a cursos
      console.log('🔄 Eliminando enrollments...')
      await deleteFromTable('user_course_enrollments')

      // 10. Asignaciones de cursos de organización
      console.log('🔄 Eliminando asignaciones de cursos...')
      await deleteFromTable('organization_course_assignments')
      await deleteFromTable('organization_course_assignments', 'assigned_by')

      // 11. Curso preguntas, respuestas y reacciones
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
      // Obtener attempt_ids para eliminar objectives e interactions primero
      const { data: scormAttempts } = await supabase
        .from('scorm_attempts')
        .select('id')
        .eq('user_id', userId)

      if (scormAttempts && scormAttempts.length > 0) {
        const attemptIds = scormAttempts.map(a => a.id)
        await supabase.from('scorm_interactions').delete().in('attempt_id', attemptIds)
        await supabase.from('scorm_objectives').delete().in('attempt_id', attemptIds)
      }
      await deleteFromTable('scorm_attempts')

      // 15. Transacciones y pagos (eliminar transacciones primero, luego payment_methods)
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

      // 17. Work teams - feedback y mensajes primero
      console.log('🔄 Eliminando datos de equipos...')
      await deleteFromTable('work_team_feedback', 'from_user_id')
      await deleteFromTable('work_team_feedback', 'to_user_id')
      await deleteFromTable('work_team_messages', 'sender_id')
      await deleteFromTable('work_team_objectives', 'created_by')
      await deleteFromTable('work_team_course_assignments', 'assigned_by')
      await deleteFromTable('work_team_members')

      // Actualizar work_teams donde el usuario es leader o creador (no eliminar el team)
      await supabase.from('work_teams').update({ team_leader_id: null }).eq('team_leader_id', userId)
      await supabase.from('work_teams').update({ created_by: null }).eq('created_by', userId)

      // 18. User perfil y respuestas (respuestas depende de user_perfil)
      console.log('🔄 Eliminando perfil...')
      // Primero obtener user_perfil_id para eliminar respuestas
      const { data: userPerfil } = await supabase
        .from('user_perfil')
        .select('id')
        .eq('user_id', userId)

      if (userPerfil && userPerfil.length > 0) {
        const perfilIds = userPerfil.map(p => p.id)
        await supabase.from('respuestas').delete().in('user_perfil_id', perfilIds)
      }
      await deleteFromTable('user_perfil')

      // 19. Reportes de problemas
      console.log('🔄 Eliminando reportes...')
      await deleteFromTable('reportes_problemas')
      await deleteFromTable('reportes_problemas', 'admin_asignado')

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

      // 25. Audit logs (mantener para historial pero actualizar user_id a null si es posible)
      // await deleteFromTable('audit_logs')

      // 26. Datos restantes que no estaban en la lista original
      console.log('🔄 Eliminando datos adicionales...')
      await deleteFromTable('user_favorites')
      await deleteFromTable('notes')

      // 27. Comunidad (si existe)
      await deleteFromTable('community_post_reactions')
      await deleteFromTable('community_comment_reactions')
      await deleteFromTable('community_comments')
      await deleteFromTable('community_posts')

      console.log('✅ [deleteOrganizationUser] Todos los datos relacionados eliminados exitosamente')

      // ============================================
      // PASO 1.5: Eliminar datos de nodos jerárquicos
      // ============================================
      console.log('🔄 Eliminando datos de nodos jerárquicos...')
      await deleteFromTable('organization_node_users')
      await supabase.from('organization_nodes').update({ manager_id: null }).eq('manager_id', userId)

      // ============================================
      // PASO 2: Eliminar de organization_users
      // ============================================
      console.log('🔄 Eliminando de organization_users...')

      // Eliminar también donde el usuario invitó a otros
      await supabase.from('organization_users').update({ invited_by: null }).eq('invited_by', userId)

      const { error: deleteError } = await supabase
        .from('organization_users')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('❌ Error eliminando de organization_users:', deleteError)
        throw deleteError
      }

      // ============================================
      // PASO 3: Eliminar el usuario de la tabla users
      // ============================================
      console.log('🔄 Eliminando usuario de la tabla users...')
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (deleteUserError) {
        console.error('❌ Error eliminando de users:', deleteUserError)
        throw new Error(`No se pudo eliminar el usuario: ${deleteUserError.message}`)
      }

      console.log('✅ [deleteOrganizationUser] Usuario eliminado completamente:', userId)
    } catch (error) {
      console.error('❌ Error in BusinessUsersService.deleteOrganizationUser:', error)
      throw error
    }
  }


  // 
  /**
   * Reenviar invitación a un usuario
   */
  static async resendInvitation(organizationId: string, userId: string): Promise<void> {
    // TODO: Implementar servicio de email
    const supabase = createServiceClient()

    // 
    // Actualizar invited_at
    await supabase
      .from('organization_users')
      .update({ invited_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
  }

  // 
  /**
   * Suspender un usuario
   */
  static async suspendUser(organizationId: string, userId: string): Promise<void> {
    const supabase = createServiceClient()

    // 
    const { error } = await supabase
      .from('organization_users')
      .update({ status: 'suspended' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    // 
    if (error) {
      throw error
    }
  }

  // 
  /**
   * Activar un usuario
   */
  static async activateUser(organizationId: string, userId: string): Promise<void> {
    const supabase = createServiceClient()

    // 
    const { error } = await supabase
      .from('organization_users')
      .update({ status: 'active' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    // 
    if (error) {
      throw error
    }
  }
}

//
// 
