import { logger as techDebtLogger } from '@/lib/utils/logger'
import { deleteSupabaseAuthUser } from '@/features/auth/services/supabase-auth-bridge.service'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import { createBusinessUsersAdminClient } from './client'
import {
  BUSINESS_USER_SIMPLE_DELETE_BATCHES,
  isIgnorableDeleteErrorCode,
} from './delete-user.config'
import { assertOrganizationUserMembership } from './query.service'
import type {
  CertificateRow,
  DeleteTarget,
} from './types'

type BusinessUsersAdminClient = ReturnType<typeof createBusinessUsersAdminClient>

async function deleteFromTable(
  supabase: BusinessUsersAdminClient,
  target: DeleteTarget,
  userId: string,
) {
  try {
    const { error } = await fromLoose(supabase, target.tableName)
      .delete()
      .eq(target.column ?? 'user_id', userId)

    if (error && !isIgnorableDeleteErrorCode(error.code)) {
      techDebtLogger.warn(`Error eliminando de ${target.tableName}:`, error.message)
    }
  } catch (error) {
    techDebtLogger.warn(`Excepcion eliminando de ${target.tableName}:`, error)
  }
}

async function executeSimpleDeleteBatches(
  supabase: BusinessUsersAdminClient,
  userId: string,
) {
  for (const batch of BUSINESS_USER_SIMPLE_DELETE_BATCHES) {
    await Promise.all(batch.map((target) => deleteFromTable(supabase, target, userId)))
  }
}

async function deleteCertificateDependencies(
  supabase: BusinessUsersAdminClient,
  userId: string,
) {
  const { data: certificates } = await fromLoose<CertificateRow>(
    supabase,
    'user_course_certificates',
  )
    .select('certificate_id')
    .eq('user_id', userId)

  if (certificates?.length) {
    await fromLoose(supabase, 'certificate_ledger')
      .delete()
      .in(
        'cert_id',
        certificates.map((certificate) => certificate.certificate_id),
      )
  }

  await deleteFromTable(supabase, { tableName: 'user_course_certificates' }, userId)
}

async function clearOwnershipReferences(
  supabase: BusinessUsersAdminClient,
  userId: string,
) {
  await Promise.all([
    fromLoose(supabase, 'work_teams')
      .update({ team_leader_id: null })
      .eq('team_leader_id', userId),
    fromLoose(supabase, 'work_teams')
      .update({ created_by: null })
      .eq('created_by', userId),
    fromLoose(supabase, 'organization_nodes')
      .update({ manager_id: null })
      .eq('manager_id', userId),
    fromLoose(supabase, 'organization_users')
      .update({ invited_by: null })
      .eq('invited_by', userId),
  ])
}

export async function deleteOrganizationUser(
  organizationId: string,
  userId: string,
): Promise<void> {
  await assertOrganizationUserMembership(organizationId, userId)

  const supabase = createBusinessUsersAdminClient()

  await executeSimpleDeleteBatches(supabase, userId)

  await Promise.all([
    deleteCertificateDependencies(supabase, userId),
    clearOwnershipReferences(supabase, userId),
  ])

  const { error: deleteOrganizationUserError } = await fromLoose(
    supabase,
    'organization_users',
  )
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (deleteOrganizationUserError) {
    throw deleteOrganizationUserError
  }

  const { error: deleteUserError } = await fromLoose(supabase, 'users')
    .delete()
    .eq('id', userId)

  if (deleteUserError) {
    throw new Error(
      `No se pudo eliminar el usuario de la plataforma: ${deleteUserError.message}`,
    )
  }

  await deleteSupabaseAuthUser(userId)
}
