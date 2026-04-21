import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '../../../../lib/supabase/types'

interface OrganizationIdRow {
  organization_id?: string | null
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no estÃ¡ configurada')
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function normalizeOrganizationId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

export async function getActiveMembershipOrganizationId(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    requestedOrganizationId?: string | null
    userId: string
  },
): Promise<string | null> {
  const query = supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', params.userId)
    .eq('status', 'active')

  const { data, error } = params.requestedOrganizationId
    ? await query.eq('organization_id', params.requestedOrganizationId).maybeSingle()
    : await query.limit(1).maybeSingle()

  if (error) {
    throw error
  }

  return normalizeOrganizationId((data as OrganizationIdRow | null)?.organization_id)
}

export async function getUniqueCourseAssignmentOrganizationId(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    courseId: string
    userId: string
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_course_assignments')
    .select('organization_id')
    .eq('user_id', params.userId)
    .eq('course_id', params.courseId)
    .neq('status', 'cancelled')

  if (error) {
    throw error
  }

  const organizationIds = Array.from(
    new Set(
      ((data || []) as OrganizationIdRow[])
        .map((row) => normalizeOrganizationId(row.organization_id))
        .filter((organizationId): organizationId is string => Boolean(organizationId)),
    ),
  )

  return organizationIds.length === 1 ? organizationIds[0] : null
}

export async function getUserProfileOrganizationId(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return normalizeOrganizationId((data as OrganizationIdRow | null)?.organization_id)
}
