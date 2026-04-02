import { NotFoundError } from '@/core/errors/app-error'

import {
  SupabaseBusinessAnalyticsRepository,
  type BusinessAnalyticsRepository,
} from './analytics.repository'
import { buildAnalyticsCsv, buildBusinessAnalyticsData } from './analytics.utils'
import type {
  AnalyticsExportFile,
  AnalyticsExportScope,
  AnalyticsTeamsData,
  BusinessAnalyticsData,
} from './analytics.types'

export class BusinessAnalyticsService {
  constructor(
    private readonly repository: BusinessAnalyticsRepository = new SupabaseBusinessAnalyticsRepository(),
  ) {}

  async getAnalytics(orgId: string): Promise<BusinessAnalyticsData> {
    const source = await this.loadSource(orgId)
    return buildBusinessAnalyticsData(source)
  }

  async getTeamAnalytics(orgId: string): Promise<AnalyticsTeamsData> {
    const analytics = await this.getAnalytics(orgId)
    return analytics.teams
  }

  async exportAnalytics(
    orgId: string,
    scope: AnalyticsExportScope,
  ): Promise<AnalyticsExportFile> {
    const analytics = await this.getAnalytics(orgId)
    const body = buildAnalyticsCsv(analytics, scope)
    const filenameSuffix =
      scope === 'summary' ? 'summary' : scope === 'teams' ? 'teams' : 'users'

    return {
      filename: `business-analytics-${analytics.organization.slug || orgId}-${filenameSuffix}.csv`,
      contentType: 'text/csv; charset=utf-8',
      body,
    }
  }

  private async loadSource(orgId: string) {
    const organization = await this.repository.findOrganization(orgId)

    if (!organization) {
      throw new NotFoundError(
        'Organizacion no encontrada',
        'ORGANIZATION_NOT_FOUND',
      )
    }

    return this.repository.fetchAnalyticsSourceData(organization)
  }
}
