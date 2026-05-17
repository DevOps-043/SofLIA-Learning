import { DatabaseError } from '@/core/errors/app-error'
import { getServiceClient } from '@/core/supabase/service-client'

import { fetchAnalyticsSourceData } from './analytics.repository.source'
import type {
  AnalyticsOrganizationInfo,
  AnalyticsSourceData,
} from './analytics.types'

export interface BusinessAnalyticsRepository {
  findOrganization(orgId: string): Promise<AnalyticsOrganizationInfo | null>
  fetchAnalyticsSourceData(
    organization: AnalyticsOrganizationInfo,
  ): Promise<AnalyticsSourceData>
}

export class SupabaseBusinessAnalyticsRepository
  implements BusinessAnalyticsRepository
{
  private readonly client = getServiceClient()

  async findOrganization(orgId: string) {
    const { data, error } = await this.client
      .from('organizations')
      .select('id, name, slug')
      .eq('id', orgId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw new DatabaseError('Error al obtener la organizacion', error)
    }

    return data as AnalyticsOrganizationInfo | null
  }

  async fetchAnalyticsSourceData(organization: AnalyticsOrganizationInfo) {
    return fetchAnalyticsSourceData(this.client, organization)
  }
}
