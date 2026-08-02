import { describe, expect, it } from 'vitest'
import { getPlatformBanBlockReason } from '../platform-action.permissions'

describe('permisos de baneo por SofLIA', () => {
  it('impide que el superadmin se banee a sí mismo', () => {
    expect(getPlatformBanBlockReason({
      actorId: 'admin-1',
      targetId: 'admin-1',
      targetIsPlatformAdmin: true,
      activePlatformAdminCount: 2,
      banned: true,
    })).toContain('propia cuenta')
  })

  it('impide banear al último superadmin activo', () => {
    expect(getPlatformBanBlockReason({
      actorId: 'admin-1',
      targetId: 'admin-2',
      targetIsPlatformAdmin: true,
      activePlatformAdminCount: 1,
      banned: true,
    })).toContain('último superadministrador')
  })

  it('permite banear a otro admin cuando queda al menos uno activo', () => {
    expect(getPlatformBanBlockReason({
      actorId: 'admin-1',
      targetId: 'admin-2',
      targetIsPlatformAdmin: true,
      activePlatformAdminCount: 2,
      banned: true,
    })).toBeNull()
  })

  it('no bloquea reactivaciones ni el baneo de usuarios normales', () => {
    expect(getPlatformBanBlockReason({
      actorId: 'admin-1',
      targetId: 'admin-1',
      targetIsPlatformAdmin: true,
      banned: false,
    })).toBeNull()
    expect(getPlatformBanBlockReason({
      actorId: 'admin-1',
      targetId: 'user-1',
      targetIsPlatformAdmin: false,
      banned: true,
    })).toBeNull()
  })
})
