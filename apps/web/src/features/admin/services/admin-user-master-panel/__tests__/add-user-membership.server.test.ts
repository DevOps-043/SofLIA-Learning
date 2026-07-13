import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

import { AddMembershipError, addUserMembership } from '../add-user-membership.server'

interface QueryResult {
  data: unknown
  error: unknown
}

function createChain(result: QueryResult) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'insert', 'update']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.maybeSingle = vi.fn(() => Promise.resolve(result))
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

function createSupabaseMock(resultsByTable: Record<string, QueryResult[]>) {
  return {
    from: vi.fn((table: string) => {
      const queue = resultsByTable[table]
      const result = queue?.shift() ?? { data: null, error: null }
      return createChain(result)
    }),
  }
}

const BASE_INPUT = {
  userId: 'user-1',
  organizationId: 'org-1',
  role: 'member' as const,
  jobTitle: null,
  invitedBy: 'admin-1',
}

describe('addUserMembership', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
  })

  it('crea una membresía nueva cuando no existe fila previa', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        users: [{ data: { id: 'user-1' }, error: null }],
        organizations: [{ data: { id: 'org-1' }, error: null }],
        organization_users: [
          { data: null, error: null }, // lookup: no existe
          { data: { id: 'membership-1' }, error: null }, // insert
        ],
      }),
    )

    const result = await addUserMembership(BASE_INPUT)

    expect(result).toEqual({
      membershipId: 'membership-1',
      organizationId: 'org-1',
      role: 'member',
      status: 'active',
      reactivated: false,
    })
  })

  it('reactiva una membresía inactiva existente', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        users: [{ data: { id: 'user-1' }, error: null }],
        organizations: [{ data: { id: 'org-1' }, error: null }],
        organization_users: [
          { data: { id: 'membership-old', status: 'removed' }, error: null }, // lookup
          { data: null, error: null }, // update
        ],
      }),
    )

    const result = await addUserMembership({ ...BASE_INPUT, role: 'admin' })

    expect(result.reactivated).toBe(true)
    expect(result.membershipId).toBe('membership-old')
    expect(result.role).toBe('admin')
  })

  it('lanza MEMBER_ALREADY_EXISTS si la membresía ya está activa', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        users: [{ data: { id: 'user-1' }, error: null }],
        organizations: [{ data: { id: 'org-1' }, error: null }],
        organization_users: [{ data: { id: 'membership-1', status: 'active' }, error: null }],
      }),
    )

    await expect(addUserMembership(BASE_INPUT)).rejects.toMatchObject({
      code: 'MEMBER_ALREADY_EXISTS',
    })
  })

  it('lanza USER_NOT_FOUND si el usuario no existe', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        users: [{ data: null, error: null }],
        organizations: [{ data: { id: 'org-1' }, error: null }],
      }),
    )

    await expect(addUserMembership(BASE_INPUT)).rejects.toBeInstanceOf(AddMembershipError)
    await expect(
      addUserMembership({ ...BASE_INPUT }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' })
  })
})
