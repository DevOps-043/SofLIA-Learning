import type { OrganizationRow, SupabaseServerClient } from './types'

export async function loadOrganizationsMap(
  supabase: SupabaseServerClient,
  organizationIds: string[],
): Promise<Map<string, OrganizationRow>> {
  if (organizationIds.length === 0) {
    return new Map<string, OrganizationRow>()
  }

  const { data, error } = await supabase
    .from('organizations')
    .select(
      'id, name, logo_url, brand_logo_url, brand_color_primary, brand_color_accent, brand_color_secondary',
    )
    .in('id', organizationIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data || []) as OrganizationRow[]).map(organization => [organization.id, organization]),
  )
}
