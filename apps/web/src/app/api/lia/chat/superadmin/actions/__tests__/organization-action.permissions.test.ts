import { describe, expect, it } from 'vitest'
import { canRemoveOrganizationMemberRole } from '../organization-action.permissions'

describe('permisos de retiro de miembros por SofLIA', () => {
  it.each(['owner', 'admin', 'member'] as const)(
    'permite al superadmin retirar un %s (el último owner se valida aparte)',
    (targetRole) => {
      expect(canRemoveOrganizationMemberRole({
        actorAuthority: 'platform-superadmin',
        organizationRole: null,
      }, targetRole)).toBe(true)
    },
  )

  it.each(['owner', 'admin', 'member'] as const)(
    'permite al owner retirar un %s (el último owner se valida aparte)',
    (targetRole) => {
      expect(canRemoveOrganizationMemberRole({
        actorAuthority: 'organization-admin',
        organizationRole: 'owner',
      }, targetRole)).toBe(true)
    },
  )

  it('permite al admin retirar miembros, pero no owners ni otros admins', () => {
    const actor = {
      actorAuthority: 'organization-admin' as const,
      organizationRole: 'admin' as const,
    }

    expect(canRemoveOrganizationMemberRole(actor, 'member')).toBe(true)
    expect(canRemoveOrganizationMemberRole(actor, 'admin')).toBe(false)
    expect(canRemoveOrganizationMemberRole(actor, 'owner')).toBe(false)
  })
})
