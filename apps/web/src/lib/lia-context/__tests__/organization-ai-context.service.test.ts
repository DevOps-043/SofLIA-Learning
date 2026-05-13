import { describe, expect, it, vi } from 'vitest'

import {
  buildOrganizationAiContextPromptSection,
  resolveStrictOrganizationAiContext,
  type OrganizationAiContextRepository,
  type ResolvedOrganizationAiContext,
} from '../services/organization-ai-context.service'

function makeContext(
  overrides: Partial<ResolvedOrganizationAiContext> = {},
): ResolvedOrganizationAiContext {
  return {
    organizationId: 'org-1',
    organizationName: 'Acme Retail',
    organizationSlug: 'acme-retail',
    userJobTitle: 'Marketing Manager',
    userJobDescription: 'Gestiona campanas B2B y automatizacion comercial.',
    organizationIndustry: 'Retail',
    organizationSize: '51-200',
    organizationType: 'B2B',
    organizationMission: 'Ayudar a tiendas regionales a vender mejor.',
    organizationCountry: 'Mexico',
    ...overrides,
  }
}

function makeRepository(
  byId: ResolvedOrganizationAiContext | null,
): OrganizationAiContextRepository {
  return {
    findMembershipByOrganizationId: vi.fn().mockResolvedValue(byId),
    findMembershipByOrganizationSlug: vi.fn().mockResolvedValue(null),
    findLatestMembership: vi.fn().mockResolvedValue(makeContext({ organizationId: 'latest' })),
  }
}

describe('organization-ai-context.service', () => {
  it('loads organization context strictly by user and organization id', async () => {
    const repository = makeRepository(makeContext())

    const context = await resolveStrictOrganizationAiContext({
      organizationId: 'org-1',
      repository,
      userId: 'user-1',
    })

    expect(context?.organizationName).toBe('Acme Retail')
    expect(repository.findMembershipByOrganizationId).toHaveBeenCalledWith(
      'user-1',
      'org-1',
    )
    expect(repository.findLatestMembership).not.toHaveBeenCalled()
  })

  it('does not fall back to latest membership for strict activity context', async () => {
    const repository = makeRepository(null)

    const context = await resolveStrictOrganizationAiContext({
      organizationId: 'org-unknown',
      repository,
      userId: 'user-1',
    })

    expect(context).toBeNull()
    expect(repository.findLatestMembership).not.toHaveBeenCalled()
  })

  it('builds a prompt section with only available organization fields', () => {
    const section = buildOrganizationAiContextPromptSection(
      makeContext({
        organizationMission: undefined,
      }),
      {
        focus: ['industry', 'scale'],
        instructions: 'Usa ejemplos de campanas con poco presupuesto.',
      },
    )

    expect(section).toContain('Acme Retail')
    expect(section).toContain('Marketing Manager')
    expect(section).toContain('Retail')
    expect(section).toContain('51-200')
    expect(section).toContain('industry, scale')
    expect(section).toContain('Usa ejemplos de campanas')
    expect(section).not.toContain('undefined')
  })

  it('omits the section when context adaptation is disabled', () => {
    expect(
      buildOrganizationAiContextPromptSection(makeContext(), { enabled: false }),
    ).toBe('')
  })
})
