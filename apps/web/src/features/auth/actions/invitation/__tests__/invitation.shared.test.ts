import { describe, expect, it } from 'vitest'

import {
  buildInvitationExpiry,
  getBulkInviteStateCheck,
  getInvitationPosition,
  isExpired,
  isInvitationToken,
  normalizeEmail,
  resolveInvitationRole,
} from '../shared'

describe('invitation/shared', () => {
  it('normalizes emails before persistence checks', () => {
    expect(normalizeEmail('  Ada@Test.COM  ')).toBe('ada@test.com')
  })

  it('detects valid invitation tokens', () => {
    expect(isInvitationToken('a'.repeat(64))).toBe(true)
    expect(isInvitationToken('not-a-token')).toBe(false)
  })

  it('returns optional position from metadata', () => {
    expect(getInvitationPosition({ position: 'CTO' })).toBe('CTO')
    expect(getInvitationPosition(null)).toBeUndefined()
  })

  it('builds seven-day expirations and detects expired timestamps', () => {
    const baseDate = new Date('2026-04-02T12:00:00.000Z')
    const expiresAt = buildInvitationExpiry(baseDate)

    expect(expiresAt).toBe('2026-04-09T12:00:00.000Z')
    expect(isExpired('2026-04-01T12:00:00.000Z', baseDate)).toBe(true)
    expect(isExpired('2026-04-03T12:00:00.000Z', baseDate)).toBe(false)
  })

  it('normalizes bulk invite roles and lifecycle checks', () => {
    expect(resolveInvitationRole(null)).toBe('member')
    expect(resolveInvitationRole('admin')).toBe('member')
    expect(resolveInvitationRole('owner')).toBe('member')
    expect(
      getBulkInviteStateCheck(
        {
          currentUses: 3,
          expiresAt: '2026-04-09T12:00:00.000Z',
          id: 'bulk-1',
          maxUses: 3,
          organizationId: 'org-1',
          role: 'admin',
          status: 'active',
        },
        new Date('2026-04-02T12:00:00.000Z'),
      ),
    ).toEqual({
      error: 'Este enlace ha alcanzado el limite de registros',
      statusToPersist: 'exhausted',
      valid: false,
    })
  })
})
