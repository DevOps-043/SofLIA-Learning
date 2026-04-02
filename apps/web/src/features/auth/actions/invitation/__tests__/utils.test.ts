import { describe, expect, it } from 'vitest'
import {
  buildInvitationExpiry,
  getInvitationPosition,
  isExpired,
  isInvitationToken,
  normalizeEmail,
} from '../shared'
import {
  getInvitationStatusError,
  parseInviteUserInput,
} from '../utils'

describe('invitation utils', () => {
  it('normalizes emails', () => {
    expect(normalizeEmail(' Test@Email.COM ')).toBe('test@email.com')
  })

  it('detects valid invitation tokens', () => {
    expect(isInvitationToken('a'.repeat(64))).toBe(true)
    expect(isInvitationToken('short-token')).toBe(false)
  })

  it('parses invite input from form data', () => {
    const formData = new FormData()
    formData.append('email', 'person@example.com')
    formData.append('organizationId', '6f67b528-2d7a-4f0e-8585-5dd8e0bd0b52')

    expect(parseInviteUserInput(formData)).toMatchObject({
      email: 'person@example.com',
      role: 'member',
    })
  })

  it('maps status and metadata helpers', () => {
    expect(getInvitationStatusError('accepted')).toContain('utilizada')
    expect(getInvitationPosition({ position: 'CEO' })).toBe('CEO')
  })

  it('computes expiration helpers', () => {
    expect(
      isExpired('2026-03-01T00:00:00.000Z', new Date('2026-03-02T00:00:00.000Z')),
    ).toBe(true)

    expect(buildInvitationExpiry(new Date('2026-04-02T00:00:00.000Z'))).toBe(
      '2026-04-09T00:00:00.000Z',
    )
  })
})
