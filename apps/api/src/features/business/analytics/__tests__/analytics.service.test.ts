import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BusinessAnalyticsRepository } from '../analytics.repository'
import { BusinessAnalyticsService } from '../analytics.service'
import { createSourceData, organization } from './analytics.fixtures'

function createRepositoryMock(): BusinessAnalyticsRepository {
  return {
    findOrganization: vi.fn(),
    fetchAnalyticsSourceData: vi.fn(),
  }
}

describe('BusinessAnalyticsService', () => {
  let repository: BusinessAnalyticsRepository
  let service: BusinessAnalyticsService

  beforeEach(() => {
    repository = createRepositoryMock()
    service = new BusinessAnalyticsService(repository)
  })

  it('builds analytics for an active organization', async () => {
    vi.mocked(repository.findOrganization).mockResolvedValue(organization)
    vi.mocked(repository.fetchAnalyticsSourceData).mockResolvedValue(
      createSourceData(),
    )

    const result = await service.getAnalytics('org-1')

    expect(result.general_metrics).toMatchObject({
      total_users: 2,
      total_courses_assigned: 2,
      completed_courses: 1,
      active_users: 1,
      total_certificates: 1,
      retention_rate: 50,
    })
    expect(result.user_analytics[0]).toMatchObject({
      user_id: 'user-1',
      display_name: 'Ana Lopez',
      courses_completed: 1,
      total_time_minutes: 120,
    })
    expect(result.teams.total_teams).toBe(1)
    expect(result.teams.ranking[0]).toMatchObject({
      team_id: 'team-1',
      member_count: 2,
    })
  })

  it('exports user analytics to csv', async () => {
    vi.mocked(repository.findOrganization).mockResolvedValue(organization)
    vi.mocked(repository.fetchAnalyticsSourceData).mockResolvedValue(
      createSourceData(),
    )

    const file = await service.exportAnalytics('org-1', 'users')

    expect(file.filename).toContain('acme-users.csv')
    expect(file.body).toContain('"user_id","display_name","email"')
    expect(file.body).toContain('"user-1","Ana Lopez","ana@example.com"')
  })

  it('throws when the organization does not exist', async () => {
    vi.mocked(repository.findOrganization).mockResolvedValue(null)

    await expect(service.getAnalytics('missing-org')).rejects.toThrow(
      'Organizacion no encontrada',
    )
  })
})
