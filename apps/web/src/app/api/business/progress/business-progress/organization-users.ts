import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import type { BusinessProgressSupabaseClient, OrganizationUserRow } from './types'

export async function fetchActiveOrganizationUsers(
  supabase: BusinessProgressSupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      role,
      status,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        first_name,
        last_name,
        display_name,
        profile_picture_url,
        last_login_at
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  if (error) {
    logger.error('Error fetching organization users:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios de la organización' },
      { status: 500 },
    )
  }

  return (data || []) as OrganizationUserRow[]
}
