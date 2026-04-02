import { createClient } from '../../../../lib/supabase/server'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import { AuditLogService } from '../auditLog.service'
import { createAdminClient } from './client'
import {
  USER_NULL_UPDATE_TABLES,
  USER_SIMPLE_DELETE_TABLES,
} from './delete-user.config'
import type { AdminUserRequestInfo } from './types'

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

async function deleteFromTable(
  adminSupabase: AdminSupabaseClient,
  tableName: string,
  userId: string,
  column = 'user_id',
) {
  try {
    const { error } = await fromLoose(adminSupabase, tableName)
      .delete()
      .eq(column, userId)

    if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
      console.warn(`Error eliminando de ${tableName}:`, error.message)
    }
  } catch (error) {
    console.warn(`Excepcion eliminando de ${tableName}:`, error)
  }
}

async function updateTableReferenceToNull(
  adminSupabase: AdminSupabaseClient,
  tableName: string,
  column: string,
  userId: string,
) {
  try {
    const { error } = await fromLoose(adminSupabase, tableName)
      .update({ [column]: null })
      .eq(column, userId)

    if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
      console.warn(`Error actualizando ${tableName}.${column}:`, error.message)
    }
  } catch (error) {
    console.warn(`Excepcion actualizando ${tableName}.${column}:`, error)
  }
}

async function deleteEnrollmentDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: enrollments } = await adminSupabase
    .from('user_course_enrollments')
    .select('enrollment_id')
    .eq('user_id', userId)

  const enrollmentIds =
    (enrollments || []).map(
      (enrollment: { enrollment_id: string }) => enrollment.enrollment_id,
    ) || []
  if (!enrollmentIds.length) {
    return
  }

  await adminSupabase
    .from('user_lesson_progress')
    .delete()
    .in('enrollment_id', enrollmentIds)
  await adminSupabase
    .from('user_quiz_submissions')
    .delete()
    .in('enrollment_id', enrollmentIds)
  await adminSupabase
    .from('user_course_certificates')
    .delete()
    .in('enrollment_id', enrollmentIds)
}

async function deleteScormDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: scormAttempts } = await adminSupabase
    .from('scorm_attempts')
    .select('id')
    .eq('user_id', userId)

  if (!scormAttempts?.length) {
    return
  }

  const attemptIds = scormAttempts.map((attempt: { id: string }) => attempt.id)
  await adminSupabase
    .from('scorm_interactions')
    .delete()
    .in('attempt_id', attemptIds)
  await adminSupabase
    .from('scorm_objectives')
    .delete()
    .in('attempt_id', attemptIds)
}

async function deleteUserPerfilDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: userPerfil } = await adminSupabase
    .from('user_perfil')
    .select('id')
    .eq('user_id', userId)

  if (!userPerfil?.length) {
    return
  }

  const perfilIds = userPerfil.map((perfil: { id: string }) => perfil.id)
  await adminSupabase.from('respuestas').delete().in('user_perfil_id', perfilIds)
}

async function deleteCommunityDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: userPosts } = await fromLoose<{ id: string }>(
    adminSupabase,
    'community_posts',
  )
    .select('id')
    .eq('user_id', userId)

  const postIds =
    (userPosts || []).map((post: { id: string }) => post.id) || []
  if (!postIds.length) {
    return
  }

  await fromLoose(adminSupabase, 'community_comments').delete().in('post_id', postIds)
  await fromLoose(adminSupabase, 'community_reactions').delete().in('post_id', postIds)
  await fromLoose(adminSupabase, 'community_post_reactions')
    .delete()
    .in('post_id', postIds)
}

async function deleteLessonDependencies(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const { data: userLessons } = await adminSupabase
    .from('course_lessons')
    .select('lesson_id')
    .eq('instructor_id', userId)

  const lessonIds =
    (userLessons || []).map(
      (lesson: { lesson_id: string }) => lesson.lesson_id,
    ) || []
  if (!lessonIds.length) {
    return
  }

  const lessonTables = [
    'lesson_activities',
    'lesson_materials',
    'lesson_checkpoints',
    'lesson_time_estimates',
    'lesson_feedback',
    'user_lesson_progress',
    'lesson_tracking',
    'lia_common_questions',
    'lesson_notes',
    'lia_conversations',
    'study_sessions',
    'user_activity_log',
  ]

  for (const tableName of lessonTables) {
    await fromLoose(adminSupabase, tableName).delete().in('lesson_id', lessonIds)
  }

  await adminSupabase
    .from('course_lessons')
    .delete()
    .eq('instructor_id', userId)
  await fromLoose(adminSupabase, 'course_lessons_en')
    .delete()
    .eq('instructor_id', userId)
  await fromLoose(adminSupabase, 'course_lessons_pt')
    .delete()
    .eq('instructor_id', userId)
}

async function executeSimpleDeletes(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  for (const config of USER_SIMPLE_DELETE_TABLES) {
    await deleteFromTable(adminSupabase, config.tableName, userId, config.column)
  }
}

async function executeNullUpdates(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  for (const config of USER_NULL_UPDATE_TABLES) {
    await updateTableReferenceToNull(
      adminSupabase,
      config.tableName,
      config.column || 'user_id',
      userId,
    )
  }
}

async function deleteOrganizationLinks(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  await fromLoose(adminSupabase, 'organization_users')
    .update({ invited_by: null })
    .eq('invited_by', userId)

  await fromLoose(adminSupabase, 'organization_course_purchases')
    .delete()
    .eq('purchased_by', userId)
}

async function deleteUserViaRpc(
  adminSupabase: AdminSupabaseClient,
  userId: string,
) {
  const rpcClient = adminSupabase as unknown as {
    rpc: (
      fn: string,
      args: { target_user_id: string },
    ) => Promise<{ error: unknown | null }>
  }

  const { error } = await rpcClient.rpc('delete_user_cascade', {
    target_user_id: userId,
  })

  return !error
}

export async function deleteAdminUser(
  userId: string,
  adminUserId: string,
  requestInfo?: AdminUserRequestInfo,
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  try {
    await AuditLogService.logAction({
      user_id: userId,
      admin_user_id: adminUserId,
      action: 'DELETE',
      table_name: 'users',
      record_id: userId,
      old_values: (userData as unknown as Record<string, unknown>) || undefined,
      new_values: undefined,
      ip_address: requestInfo?.ip,
      user_agent: requestInfo?.userAgent,
    })
  } catch {}

  const deletedViaRpc = await deleteUserViaRpc(adminSupabase, userId)
  if (deletedViaRpc) {
    return
  }

  await deleteEnrollmentDependencies(adminSupabase, userId)
  await executeSimpleDeletes(adminSupabase, userId)
  await deleteScormDependencies(adminSupabase, userId)
  await deleteUserPerfilDependencies(adminSupabase, userId)
  await deleteCommunityDependencies(adminSupabase, userId)
  await deleteOrganizationLinks(adminSupabase, userId)
  await deleteLessonDependencies(adminSupabase, userId)
  await executeNullUpdates(adminSupabase, userId)

  await adminSupabase.from('users').delete().eq('id', userId)
}
