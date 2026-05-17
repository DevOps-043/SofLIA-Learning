import type {
  InvitationRepository,
  OrganizationSummary,
} from '../types'
import { normalizeOrganizationSummary } from './mappers'
import { organizationsTable } from './tables'

type OrganizationMethods = Pick<
  InvitationRepository,
  'getOrganizationById' | 'getOrganizationSlug'
>

export function createOrganizationMethods(
  supabase: unknown
): OrganizationMethods {
  return {
    async getOrganizationById(
      organizationId: string
    ): Promise<OrganizationSummary | null> {
      const { data } = await organizationsTable(supabase)
        .select('id, name, slug, logo_url')
        .eq('id', organizationId)
        .single()

      return normalizeOrganizationSummary(data)
    },

    async getOrganizationSlug(organizationId: string): Promise<string | null> {
      const { data } = await organizationsTable(supabase)
        .select('slug')
        .eq('id', organizationId)
        .single()

      return data?.slug ?? null
    },
  }
}
