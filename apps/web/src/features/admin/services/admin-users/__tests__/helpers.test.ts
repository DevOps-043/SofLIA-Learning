import { describe, expect, it } from 'vitest'
import { buildAdminUserUpdatePayload } from '../helpers'

describe('buildAdminUserUpdatePayload — suspensión de cuenta', () => {
  it('no toca banned_at/ban_reason cuando la petición no trae is_banned', () => {
    const payload = buildAdminUserUpdatePayload({ first_name: 'Ada' })

    expect(payload.is_banned).toBeUndefined()
    expect(payload.banned_at).toBeUndefined()
    expect(payload.ban_reason).toBeUndefined()
  })

  it('al suspender estampa banned_at server-side y conserva el motivo', () => {
    const payload = buildAdminUserUpdatePayload({
      is_banned: true,
      ban_reason: 'incumplimiento de políticas',
    })

    expect(payload.is_banned).toBe(true)
    expect(typeof payload.banned_at).toBe('string')
    expect(payload.ban_reason).toBe('incumplimiento de políticas')
  })

  it('al suspender sin motivo guarda ban_reason null (no cadena vacía)', () => {
    const payload = buildAdminUserUpdatePayload({ is_banned: true, ban_reason: '' })

    expect(payload.ban_reason).toBeNull()
  })

  it('al reactivar limpia banned_at y ban_reason', () => {
    const payload = buildAdminUserUpdatePayload({
      is_banned: false,
      ban_reason: 'esto debe ignorarse',
    })

    expect(payload.is_banned).toBe(false)
    expect(payload.banned_at).toBeNull()
    expect(payload.ban_reason).toBeNull()
  })
})
