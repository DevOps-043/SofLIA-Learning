import { describe, expect, it, vi } from 'vitest'
import {
  extractOrganizationSlugFromPage,
  resolveActiveOrganizationContext,
  type OrganizationContextRepository,
  type ResolvedOrganizationContext,
} from '../organization-context.service'

function createRepositoryStub(overrides?: {
  byId?: ResolvedOrganizationContext | null
  bySlug?: ResolvedOrganizationContext | null
  latest?: ResolvedOrganizationContext | null
}): OrganizationContextRepository {
  return {
    findMembershipByOrganizationId: vi
      .fn()
      .mockResolvedValue(overrides?.byId ?? null),
    findMembershipByOrganizationSlug: vi
      .fn()
      .mockResolvedValue(overrides?.bySlug ?? null),
    findLatestMembership: vi.fn().mockResolvedValue(overrides?.latest ?? null),
  }
}

describe('organization-context.service', () => {
  it('prefers the organization slug from the active business route', async () => {
    const repository = createRepositoryStub({
      bySlug: {
        organizationId: 'board-ready-id',
        organizationName: 'Board Ready',
        organizationSlug: 'board-ready',
        userJobTitle: 'Director comercial',
      },
      byId: {
        organizationId: 'pulsehub-id',
        organizationName: 'Pulse Hub',
        organizationSlug: 'pulse-hub',
        userJobTitle: 'Director comercial',
      },
    })

    const organizationContext = await resolveActiveOrganizationContext({
      userId: 'user-1',
      requestedOrganizationId: 'pulsehub-id',
      currentPage: '/board-ready/business-user/dashboard',
      repository,
    })

    expect(organizationContext?.organizationSlug).toBe('board-ready')
    expect(repository.findMembershipByOrganizationSlug).toHaveBeenCalledWith(
      'user-1',
      'board-ready',
    )
    expect(repository.findMembershipByOrganizationId).not.toHaveBeenCalled()
  })

  it('falls back to the explicitly requested organization id on non-org routes', async () => {
    const repository = createRepositoryStub({
      byId: {
        organizationId: 'board-ready-id',
        organizationName: 'Board Ready',
        organizationSlug: 'board-ready',
        userJobTitle: 'Director comercial',
      },
    })

    const organizationContext = await resolveActiveOrganizationContext({
      userId: 'user-1',
      requestedOrganizationId: 'board-ready-id',
      currentPage: '/courses/ia-para-lideres/learn',
      repository,
    })

    expect(organizationContext?.organizationId).toBe('board-ready-id')
    expect(repository.findMembershipByOrganizationId).toHaveBeenCalledWith(
      'user-1',
      'board-ready-id',
    )
  })

  it('falls back to the latest active membership when no session org is available', async () => {
    const repository = createRepositoryStub({
      latest: {
        organizationId: 'board-ready-id',
        organizationName: 'Board Ready',
        organizationSlug: 'board-ready',
        userJobTitle: 'Director comercial',
      },
    })

    const organizationContext = await resolveActiveOrganizationContext({
      userId: 'user-1',
      repository,
    })

    expect(organizationContext?.organizationName).toBe('Board Ready')
    expect(repository.findLatestMembership).toHaveBeenCalledWith('user-1')
  })

  it('extracts organization slugs only from business routes', () => {
    expect(
      extractOrganizationSlugFromPage('/board-ready/business-user/dashboard'),
    ).toBe('board-ready')
    expect(
      extractOrganizationSlugFromPage('/board-ready/business-panel/settings'),
    ).toBe('board-ready')
    expect(extractOrganizationSlugFromPage('/courses/ia-para-lideres/learn')).toBe(
      undefined,
    )
  })
})
