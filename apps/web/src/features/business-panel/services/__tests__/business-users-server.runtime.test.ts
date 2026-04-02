import { describe, expect, it } from 'vitest'

describe('business-users-server runtime imports', () => {
  it('loads query, mutation and delete modules', async () => {
    const query = await import('../business-users-server/query.service')
    const mutation = await import('../business-users-server/mutation.service')
    const deleteUser = await import('../business-users-server/delete-user.service')

    expect(typeof query.getOrganizationUsers).toBe('function')
    expect(typeof query.getOrganizationStats).toBe('function')
    expect(typeof mutation.createOrganizationUser).toBe('function')
    expect(typeof mutation.updateOrganizationUser).toBe('function')
    expect(typeof deleteUser.deleteOrganizationUser).toBe('function')
  })
})
