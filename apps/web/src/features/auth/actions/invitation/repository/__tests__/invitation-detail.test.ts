import { describe, expect, it, vi } from 'vitest'

import { createInvitationDetailMethods } from '../invitation-detail'

describe('invitation detail repository', () => {
  it('scopes individual bearer tokens to the requested organization', async () => {
    const query = createQuery({
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    })
    const repository = createInvitationDetailMethods({
      from: vi.fn(() => ({ select: vi.fn(() => query) })),
    })

    await expect(
      repository.getInvitationForConsume('a'.repeat(64), 'org-1', true),
    ).resolves.toBeNull()

    expect(query.eq).toHaveBeenNthCalledWith(1, 'status', 'pending')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'organization_id', 'org-1')
    expect(query.eq).toHaveBeenNthCalledWith(3, 'token', 'a'.repeat(64))
  })

  it('does not turn database failures into missing invitations', async () => {
    const databaseError = { code: 'XX000', message: 'Database unavailable' }
    const query = createQuery({ data: null, error: databaseError })
    const repository = createInvitationDetailMethods({
      from: vi.fn(() => ({ select: vi.fn(() => query) })),
    })

    await expect(
      repository.getInvitationForConsume('a'.repeat(64), 'org-1', true),
    ).rejects.toEqual(databaseError)
  })
})

function createQuery(result: {
  data: null
  error: { code: string; message: string }
}) {
  const query = {
    eq: vi.fn(),
    single: vi.fn(async () => result),
  }
  query.eq.mockReturnValue(query)
  return query
}
