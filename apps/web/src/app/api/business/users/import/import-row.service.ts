import { createAdminClient } from '@/lib/supabase/admin'
import type { createClient } from '@/lib/supabase/server'
import {
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
} from '@/lib/schemas/user-demographics.schema'
import {
  mapProvisioningError,
  provisionAuthAccount,
  rollbackProvisionedAuthAccount,
} from '@/features/auth/services/auth-account-provisioning.service'
import { getExistingUserImportError } from './existing-user.service'
import { autoAssignUserToDefaultTeam } from './hierarchy'
import type { ImportContext, ParsedImportUserRow, UserInsertData } from './types'
import { validateImportUserRow } from './validation'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function importUserRow(params: {
  supabase: SupabaseServerClient
  userData: ParsedImportUserRow
  context: ImportContext
}) {
  const { supabase, userData, context } = params
  const validation = validateImportUserRow(userData)
  if (!validation.success) return { success: false as const, error: validation.error }

  const existingUserError = await getExistingUserImportError(
    supabase,
    userData,
    context,
  )
  if (existingUserError) {
    return { success: false as const, ...existingUserError }
  }

  let userId = ''
  try {
    const provisioned = await provisionAuthAccount({
      cargoRol: 'Business',
      dateOfBirth: normalizeDateOfBirthForStorage(validation.demographics.date_of_birth),
      displayName: userData.display_name ||
        `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
        null,
      email: userData.email,
      emailVerified: true,
      firstName: userData.first_name || null,
      gender: normalizeGenderForStorage(validation.demographics.gender),
      lastName: userData.last_name || null,
      password: validation.password,
      username: userData.username,
    })
    userId = provisioned.userId
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? mapProvisioningError(error) : 'Error al crear usuario Auth',
    }
  }

  const userInsertData: UserInsertData = {
    id: userId,
    username: userData.username,
    email: userData.email,
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    display_name: userData.display_name ||
      `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
      null,
    cargo_rol: 'Business',
    date_of_birth: normalizeDateOfBirthForStorage(validation.demographics.date_of_birth),
    gender: normalizeGenderForStorage(validation.demographics.gender),
  }

  const adminSupabase = createAdminClient()
  const { data: newUser, error: userError } = await adminSupabase
    .from('users')
    .upsert(userInsertData, { onConflict: 'id' })
    .select('id')
    .single()

  if (userError) {
    await rollbackProvisionedAuthAccount(userId)
    return { success: false as const, error: userError.message || 'Error al crear usuario' }
  }

  const { error: orgUserError } = await adminSupabase.from('organization_users').insert({
    organization_id: context.organizationId,
    user_id: newUser.id,
    role: validation.orgRole,
    job_title: userData.job_title.trim(),
    status: 'active',
    invited_by: context.createdBy,
    invited_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
  })

  if (orgUserError) {
    await adminSupabase.from('users').delete().eq('id', newUser.id)
    await rollbackProvisionedAuthAccount(newUser.id)
    return {
      success: false as const,
      error: orgUserError.message || 'Error al agregar usuario a la organizacion',
    }
  }

  if (validation.orgRole === 'member') {
    await autoAssignUserToDefaultTeam(adminSupabase, newUser.id, context.hierarchy)
  }

  return { success: true as const }
}
