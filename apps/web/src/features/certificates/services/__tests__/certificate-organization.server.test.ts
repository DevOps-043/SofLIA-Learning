import { describe, expect, it } from 'vitest'
import { resolveEffectiveOrganizationId } from '@/features/certificates/services/certificate-organization.server'

describe('certificate-organization.server', () => {
  it('prefers the enrollment organization over a stale certificate organization', () => {
    expect(
      resolveEffectiveOrganizationId({
        certificateOrganizationId: 'org-cert',
        enrollmentId: 'enrollment-1',
        enrollmentOrganizations: new Map([['enrollment-1', 'org-enrollment']]),
        primaryOrganizations: new Map([['user-1', 'org-primary']]),
        userId: 'user-1',
      }),
    ).toBe('org-enrollment')
  })

  it('falls back to the persisted certificate organization when the enrollment exists without organization', () => {
    expect(
      resolveEffectiveOrganizationId({
        certificateOrganizationId: 'org-cert-stale',
        enrollmentId: 'enrollment-1',
        enrollmentOrganizations: new Map([['enrollment-1', null]]),
        primaryOrganizations: new Map([['user-1', 'org-primary']]),
        userId: 'user-1',
      }),
    ).toBe('org-cert-stale')
  })

  it('falls back to the persisted certificate organization when enrollment context is unavailable', () => {
    expect(
      resolveEffectiveOrganizationId({
        certificateOrganizationId: 'org-cert',
        enrollmentId: null,
        enrollmentOrganizations: new Map(),
        primaryOrganizations: new Map([['user-1', 'org-primary']]),
        userId: 'user-1',
      }),
    ).toBe('org-cert')
  })

  it('returns null when no organization source is available', () => {
    expect(
      resolveEffectiveOrganizationId({
        certificateOrganizationId: null,
        enrollmentId: null,
        enrollmentOrganizations: new Map(),
        primaryOrganizations: new Map(),
        userId: 'user-1',
      }),
    ).toBeNull()
  })
})
