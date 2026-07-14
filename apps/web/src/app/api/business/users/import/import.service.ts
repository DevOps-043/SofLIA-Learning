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

import {
  buildUserDataFromCsvLine,
  parseImportCsvContent,
} from './csv'
import { loadHierarchyAutoAssignConfig } from './hierarchy'
import type {
  HierarchyAutoAssignConfig,
  ImportResult,
  ParsedImportUserRow,
  UserInsertData,
} from './types'
import {
  validateImportUserRow,
  type ImportUserRowValidationResult,
} from './validation'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

interface ImportRowCandidate {
  rowNumber: number
  userData: ParsedImportUserRow
}

interface ValidImportRow extends ImportRowCandidate {
  validation: Extract<ImportUserRowValidationResult, { success: true }>
}

interface AuthReadyImportRow extends ValidImportRow {
  userId: string
}

interface ExistingUserLookup {
  id: string
  email: string | null
  username: string
}

interface ExistingOrgUserLookup {
  user_id: string
  role: string | null
}

interface CreatedUserLookup {
  id: string
  email: string | null
  username: string
}

export async function importBusinessUsersFromCsv(params: {
  fileContent: string
  organizationId: string
  createdBy: string
}) {
  const parsedCsv = parseImportCsvContent(params.fileContent)
  if ('error' in parsedCsv) return { success: false as const, error: parsedCsv.error }

  const supabase = createAdminClient()
  const hierarchy = await loadHierarchyAutoAssignConfig(
    supabase,
    params.organizationId,
  )
  const result: ImportResult = {
    success: 0,
    errors: [],
    total: parsedCsv.total,
  }

  const validRows = collectValidRows(parsedCsv.lines, parsedCsv.headers, result)
  if (validRows.length === 0) {
    return { success: true as const, result }
  }

  const duplicateRows = await findDuplicateRows(
    supabase,
    validRows,
    params.organizationId,
  )
  const rowsToCreate = validRows.filter((row) => {
    const duplicate = duplicateRows.get(row.rowNumber)
    if (duplicate) result.errors.push(duplicate)
    return !duplicate
  })

  if (rowsToCreate.length === 0) {
    return { success: true as const, result }
  }

  const authReadyRows: AuthReadyImportRow[] = []
  for (const row of rowsToCreate) {
    try {
      const provisioned = await provisionAuthAccount({
        cargoRol: 'Business',
        dateOfBirth: normalizeDateOfBirthForStorage(row.validation.demographics.date_of_birth),
        displayName: row.userData.display_name ||
          `${row.userData.first_name || ''} ${row.userData.last_name || ''}`.trim() ||
          null,
        email: row.userData.email,
        emailVerified: true,
        firstName: row.userData.first_name || null,
        gender: normalizeGenderForStorage(row.validation.demographics.gender),
        lastName: row.userData.last_name || null,
        password: row.validation.password,
        username: row.userData.username,
      })
      authReadyRows.push({ ...row, userId: provisioned.userId })
    } catch (error) {
      result.errors.push({
        row: row.rowNumber,
        error: error instanceof Error ? mapProvisioningError(error) : 'Error al crear usuario Auth',
        data: row.userData,
      })
    }
  }

  if (authReadyRows.length === 0) {
    return { success: true as const, result }
  }

  const usersToInsert = authReadyRows.map((row) =>
    buildUserInsertData(row),
  )

  const { data: createdUsers, error: usersError } = await supabase
    .from('users')
      .upsert(usersToInsert, { onConflict: 'id' })
    .select('id, email, username')

  if (usersError || !createdUsers) {
    await rollbackAuthUsers(authReadyRows.map((row) => row.userId))
    authReadyRows.forEach((row) => {
      result.errors.push({
        row: row.rowNumber,
        error: usersError?.message || 'Error al crear usuarios',
        data: row.userData,
      })
    })
    return { success: true as const, result }
  }

  const createdUserByEmail = mapUsersByEmail(createdUsers as CreatedUserLookup[])
  const organizationUsers = authReadyRows.flatMap((row) => {
    const createdUser = createdUserByEmail.get(normalizeLookupValue(row.userData.email))
    if (!createdUser) {
      result.errors.push({
        row: row.rowNumber,
        error: 'El usuario fue creado pero no se pudo resolver su identificador',
        data: row.userData,
      })
      return []
    }

    return [{
      organization_id: params.organizationId,
      user_id: createdUser.id,
      role: row.validation.orgRole,
      job_title: row.userData.job_title.trim(),
      status: 'active',
      invited_by: params.createdBy,
      invited_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
    }]
  })

  const { error: orgUsersError } = await supabase
    .from('organization_users')
    .insert(organizationUsers)

  if (orgUsersError) {
    await rollbackCreatedUsers(supabase, createdUsers as CreatedUserLookup[])
    await rollbackAuthUsers(authReadyRows.map((row) => row.userId))
    authReadyRows.forEach((row) => {
      result.errors.push({
        row: row.rowNumber,
        error: orgUsersError.message || 'Error al agregar usuarios a la organización',
        data: row.userData,
      })
    })
    return { success: true as const, result }
  }

  await assignCreatedMembersToDefaultTeam(
    supabase,
    authReadyRows,
    createdUserByEmail,
    hierarchy,
  )
  result.success += organizationUsers.length

  return { success: true as const, result }
}

function collectValidRows(
  lines: string[],
  headers: string[],
  result: ImportResult,
): ValidImportRow[] {
  const validRows: ValidImportRow[] = []
  const seenEmails = new Set<string>()
  const seenUsernames = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const rowNumber = i + 1
    const userData = buildUserDataFromCsvLine(headers, line)
    const validation = validateImportUserRow(userData)
    if (!validation.success) {
      result.errors.push({ row: rowNumber, error: validation.error, data: userData })
      continue
    }

    const emailKey = normalizeLookupValue(userData.email)
    const usernameKey = normalizeLookupValue(userData.username)
    if (seenEmails.has(emailKey) || seenUsernames.has(usernameKey)) {
      result.errors.push({
        row: rowNumber,
        error: 'Usuario duplicado dentro del CSV',
        data: userData,
      })
      continue
    }

    seenEmails.add(emailKey)
    seenUsernames.add(usernameKey)
    validRows.push({ rowNumber, userData, validation })
  }

  return validRows
}

async function findDuplicateRows(
  supabase: SupabaseServerClient,
  rows: ValidImportRow[],
  organizationId: string,
) {
  const emails = unique(rows.map((row) => normalizeLookupValue(row.userData.email)))
  const usernames = unique(rows.map((row) => row.userData.username.trim()))

  const [emailUsersResult, usernameUsersResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, username')
      .in('email', emails),
    supabase
      .from('users')
      .select('id, email, username')
      .in('username', usernames),
  ])

  const existingUsers = [
    ...((emailUsersResult.data || []) as ExistingUserLookup[]),
    ...((usernameUsersResult.data || []) as ExistingUserLookup[]),
  ]
  const existingUserIds = unique(existingUsers.map((user) => user.id))
  const existingMemberships = await loadExistingMemberships(
    supabase,
    organizationId,
    existingUserIds,
  )
  const membershipByUserId = new Map(
    existingMemberships.map((membership) => [membership.user_id, membership]),
  )
  const existingUserByEmail = mapUsersByEmail(existingUsers)
  const existingUserByUsername = new Map(
    existingUsers.map((user) => [normalizeLookupValue(user.username), user]),
  )
  const duplicateRows = new Map<number, ImportResult['errors'][number]>()

  rows.forEach((row) => {
    const existingUser =
      existingUserByEmail.get(normalizeLookupValue(row.userData.email)) ||
      existingUserByUsername.get(normalizeLookupValue(row.userData.username))

    if (!existingUser) return

    const existingOrgUser = membershipByUserId.get(existingUser.id)
    duplicateRows.set(row.rowNumber, {
      row: row.rowNumber,
      error: existingOrgUser
        ? `Este usuario ya es miembro de tu organización (Rol: ${existingOrgUser.role}).`
        : 'Este correo ya está registrado en la plataforma pero NO en tu organización. Por favor utiliza la opción "Invitar" para agregarlo a tu equipo.',
      data: existingOrgUser
        ? { ...row.userData, existing_role: existingOrgUser.role }
        : row.userData,
    })
  })

  return duplicateRows
}

async function loadExistingMemberships(
  supabase: SupabaseServerClient,
  organizationId: string,
  userIds: string[],
): Promise<ExistingOrgUserLookup[]> {
  if (userIds.length === 0) return []

  const { data } = await supabase
    .from('organization_users')
    .select('user_id, role')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)

  return (data || []) as ExistingOrgUserLookup[]
}

function buildUserInsertData(
  row: AuthReadyImportRow,
): UserInsertData {
  const { userData, validation } = row

  return {
    id: row.userId,
    username: userData.username,
    email: userData.email,
    first_name: userData.first_name || null,
    last_name: userData.last_name || null,
    display_name: userData.display_name ||
      `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
      null,
    platform_role: 'Business',
    date_of_birth: normalizeDateOfBirthForStorage(validation.demographics.date_of_birth),
    gender: normalizeGenderForStorage(validation.demographics.gender),
  }
}

async function assignCreatedMembersToDefaultTeam(
  supabase: SupabaseServerClient,
  rows: ValidImportRow[],
  createdUserByEmail: Map<string, CreatedUserLookup>,
  hierarchy: HierarchyAutoAssignConfig,
) {
  if (!hierarchy.enabled || !hierarchy.defaultTeamId) return

  const nodeUsers = rows.flatMap((row) => {
    if (row.validation.orgRole !== 'member') return []

    const createdUser = createdUserByEmail.get(normalizeLookupValue(row.userData.email))
    if (!createdUser) return []

    return [{
      node_id: hierarchy.defaultTeamId,
      user_id: createdUser.id,
      role: 'member',
      is_primary: true,
    }]
  })

  if (nodeUsers.length === 0) return

  await supabase.from('organization_node_users').insert(nodeUsers)
}

async function rollbackCreatedUsers(
  supabase: SupabaseServerClient,
  createdUsers: CreatedUserLookup[],
) {
  const createdUserIds = createdUsers.map((user) => user.id)
  if (createdUserIds.length === 0) return

  await supabase.from('users').delete().in('id', createdUserIds)
}

async function rollbackAuthUsers(userIds: string[]) {
  for (const userId of userIds) {
    await rollbackProvisionedAuthAccount(userId)
  }
}

function mapUsersByEmail<T extends { email: string | null }>(users: T[]) {
  return new Map(
    users
      .filter((user): user is T & { email: string } => Boolean(user.email))
      .map((user) => [normalizeLookupValue(user.email), user]),
  )
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase()
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}
