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

    try {
      // Obtener usuarios actuales de la organización
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('organization_users')
        .select('role, status')
        .eq('organization_id', organizationId)

      if (orgUsersError) throw orgUsersError

      // Obtener invitaciones individuales pendientes
      const { data: pendingInvitations, error: invError } = await supabase
        .from('user_invitations')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')

      if (invError) throw invError

      // Obtener uso de enlaces masivos
      const { data: bulkLinks } = await supabase
        .from('bulk_invite_links')
        .select('current_uses')
        .eq('organization_id', organizationId)

      const bulkLinkUsage = bulkLinks?.reduce((sum, link) => sum + (link.current_uses || 0), 0) || 0

      const stats: BusinessUserStats = {
        total: (orgUsers?.length || 0) + (pendingInvitations?.length || 0),
        active: orgUsers?.filter((u: any) => u.status === 'active').length || 0,
        invited: (orgUsers?.filter((u: any) => u.status === 'invited').length || 0) + (pendingInvitations?.length || 0),
        suspended: orgUsers?.filter((u: any) => u.status === 'suspended').length || 0,
        admins: (orgUsers?.filter((u: any) => u.role === 'admin' || u.role === 'owner').length || 0) + 
                (pendingInvitations?.filter((i: any) => i.role === 'admin' || i.role === 'owner').length || 0),
        members: (orgUsers?.filter((u: any) => u.role === 'member').length || 0) + 
                 (pendingInvitations?.filter((i: any) => i.role === 'member').length || 0),
        bulk_link_usage: bulkLinkUsage
      }

      return stats
    } catch (error) {
      console.error('Error in BusinessUsersService.getOrganizationStats:', error)
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

      // Convertir errores de Supabase/PostgreSQL a mensajes amigables
      if (error && typeof error === 'object' && 'code' in error) {
        const pgError = error as { code: string; message?: string; details?: string; constraint?: string }

        // Error de clave única duplicada (PostgreSQL 23505)
        if (pgError.code === '23505') {
          const constraintOrMsg = (pgError.constraint || pgError.details || pgError.message || '').toLowerCase()

          if (constraintOrMsg.includes('email')) {
            throw new Error('El correo electrónico ya está registrado en la plataforma. Este usuario existe en otra empresa.')
          }
          if (constraintOrMsg.includes('username')) {
            throw new Error('El nombre de usuario ya está en uso. Por favor elige otro nombre de usuario.')
          }
          // Fallback genérico para duplicado
          throw new Error('Este usuario ya existe en la plataforma (correo o usuario duplicado). Por favor verifica los datos.')
        }
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
        ...(orgUserData.users as any),
        org_role: orgUserData?.role || 'member',
        org_status: orgUserData?.status || 'active',
        joined_at: orgUserData?.joined_at
      } as BusinessUser
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
      // PASO 1: Eliminar datos dependientes (Optimizado con Promise.all)
      // ============================================
      console.log('🔄 Iniciando eliminación de datos relacionados en paralelo...')

      // GRUPO 1: Datos sin dependencias mutuas
      await Promise.all([
        // LIA
        deleteFromTable('lia_user_feedback'),
        deleteFromTable('lia_activity_completions'),
        deleteFromTable('lia_conversations'),
        
        // Progreso y Tracking
        deleteFromTable('user_quiz_submissions'),
        deleteFromTable('lesson_tracking'),
        deleteFromTable('user_lesson_progress'),
        deleteFromTable('daily_progress'),
        deleteFromTable('user_lesson_notes'),
        
        // Notificaciones y Preferencias
        deleteFromTable('notification_email_queue'),
        deleteFromTable('notification_push_subscriptions'),
        deleteFromTable('notification_stats'),
        deleteFromTable('user_notification_preferences'),
        deleteFromTable('user_notifications'),
        
        // Calendario
        deleteFromTable('user_calendar_events'),
        deleteFromTable('calendar_subscription_tokens'),
        deleteFromTable('calendar_integrations'),
        
        // Auditoría y Logs (MANTENER HISTORIAL ES OPCIONAL, PERO PARA ELIMINACIÓN TOTAL:)
        deleteFromTable('audit_logs'),
        deleteFromTable('audit_logs', 'admin_user_id'),
        deleteFromTable('user_activity_log'),
        deleteFromTable('ai_moderation_logs'),
        
        // Otros
        deleteFromTable('user_favorites'),
        deleteFromTable('notes'),
        deleteFromTable('user_warnings'),
        deleteFromTable('user_tour_progress'),
        deleteFromTable('reportes_problemas'),
        deleteFromTable('reportes_problemas', 'admin_asignado'),
        deleteFromTable('admin_dashboard_layouts'),
        deleteFromTable('admin_dashboard_preferences'),
        deleteFromTable('study_preferences'),
        deleteFromTable('user_streaks'),
        deleteFromTable('oauth_accounts'),
        deleteFromTable('password_reset_tokens'),
        deleteFromTable('refresh_tokens'),
        deleteFromTable('user_session')
      ])

      // GRUPO 2: Datos con dependencias específicas o de mayor peso
      await Promise.all([
        // Certificados (LEDGER primero si hay relación directa, pero aquí borramos ambos)
        (async () => {
          const { data: certs } = await supabase.from('user_course_certificates').select('certificate_id').eq('user_id', userId)
          if (certs && certs.length > 0) {
            await supabase.from('certificate_ledger').delete().in('cert_id', certs.map(c => c.certificate_id))
          }
          await deleteFromTable('user_course_certificates')
        })(),

        // SCORM
        (async () => {
          const { data: scormAttempts } = await supabase.from('scorm_attempts').select('id').eq('user_id', userId)
          if (scormAttempts && scormAttempts.length > 0) {
            const attemptIds = scormAttempts.map(a => a.id)
            await Promise.all([
              supabase.from('scorm_interactions').delete().in('attempt_id', attemptIds),
              supabase.from('scorm_objectives').delete().in('attempt_id', attemptIds)
            ])
          }
          await deleteFromTable('scorm_attempts')
        })(),

        // Comunidad y Q&A
        Promise.all([
          deleteFromTable('course_question_reactions'),
          deleteFromTable('course_question_responses'),
          deleteFromTable('course_questions'),
          deleteFromTable('course_reviews'),
          deleteFromTable('lesson_feedback'),
          deleteFromTable('community_post_reactions'),
          deleteFromTable('community_comment_reactions'),
          deleteFromTable('community_comments'),
          deleteFromTable('community_posts')
        ]),

        // Planeación y Estudio
        Promise.all([
          deleteFromTable('study_sessions'),
          deleteFromTable('calendar_sync_history'),
          deleteFromTable('study_plans')
        ]),

        // Compras y Transacciones
        Promise.all([
          deleteFromTable('organization_course_purchases', 'purchased_by'),
          deleteFromTable('transactions'),
          deleteFromTable('subscriptions'),
          deleteFromTable('payment_methods')
        ]),

        // Inscripciones y Asignaciones
        Promise.all([
          deleteFromTable('user_course_enrollments'),
          deleteFromTable('organization_course_assignments'),
          deleteFromTable('organization_course_assignments', 'assigned_by')
        ]),

        // Creaciones (SCORM y otros donde el usuario pudo ser owner)
        deleteFromTable('scorm_packages', 'created_by'),
        deleteFromTable('user_invitations', 'created_by')
      ])

      // GRUPO 3: Equipos y Estructurales
      await Promise.all([
        deleteFromTable('work_team_feedback', 'from_user_id'),
        deleteFromTable('work_team_feedback', 'to_user_id'),
        deleteFromTable('work_team_messages', 'sender_id'),
        deleteFromTable('work_team_objectives', 'created_by'),
        deleteFromTable('work_team_course_assignments', 'assigned_by'),
        deleteFromTable('work_team_members'),
        
        // Actualizar work_teams donde el usuario es leader o creador
        supabase.from('work_teams').update({ team_leader_id: null }).eq('team_leader_id', userId),
        supabase.from('work_teams').update({ created_by: null }).eq('created_by', userId),
        
        // Perfil y respuestas
        (async () => {
          const { data: userPerfil } = await supabase.from('user_perfil').select('id').eq('user_id', userId)
          if (userPerfil && userPerfil.length > 0) {
            await supabase.from('respuestas').delete().in('user_perfil_id', userPerfil.map(p => p.id))
          }
          await deleteFromTable('user_perfil')
        })(),

        // Jerarquía de organización
        deleteFromTable('organization_node_users'),
        supabase.from('organization_nodes').update({ manager_id: null }).eq('manager_id', userId)
      ])

      console.log('✅ Eliminación de datos relacionados completada')

      // ============================================
      // PASO 2: Eliminar de organization_users
      // ============================================
      await supabase.from('organization_users').update({ invited_by: null }).eq('invited_by', userId)

      const { error: deleteOrgUserError } = await supabase
        .from('organization_users')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      if (deleteOrgUserError) throw deleteOrgUserError

      // ============================================
      // PASO 3: Eliminar el usuario de la tabla users
      // ============================================
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (deleteUserError) {
        throw new Error(`No se pudo eliminar el usuario de la plataforma: ${deleteUserError.message}`)
      }

      console.log('✅ [deleteOrganizationUser] Usuario eliminado completamente:', userId)

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
