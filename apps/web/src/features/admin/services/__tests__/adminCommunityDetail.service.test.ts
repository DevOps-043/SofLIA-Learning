import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdminCommunityDetailService,
  removeAdminCommunityMember,
  removeAdminCommunityPost,
  replaceAdminCommunityMemberRole,
  toggleAdminCommunityPostBoolean,
  updateAdminCommunityRequestStatus
} from '../adminCommunityDetail.service'

describe('adminCommunityDetail.service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads the aggregated community detail endpoint', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          community: { id: 'community-1', name: 'Comunidad' },
          posts: [],
          members: [],
          accessRequests: [],
          videos: []
        }),
        { status: 200 }
      )
    )

    const result = await AdminCommunityDetailService.getCommunityDetail('comunidad')

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/communities/slug/comunidad/detail')
    expect(result.community).toMatchObject({ id: 'community-1', name: 'Comunidad' })
  })

  it('propagates API errors with the backend message', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Sin permisos' }), { status: 403 })
    )

    await expect(AdminCommunityDetailService.updateMemberRole('community-1', 'member-1', 'admin')).rejects.toThrow('Sin permisos')
  })

  it('updates helper collections immutably', () => {
    expect(
      replaceAdminCommunityMemberRole(
        [{ id: 'member-1', role: 'member', joined_at: '2026-04-01T00:00:00.000Z' }],
        'member-1',
        'admin'
      )
    ).toEqual([{ id: 'member-1', role: 'admin', joined_at: '2026-04-01T00:00:00.000Z' }])

    expect(
      removeAdminCommunityMember([
        { id: 'member-1', role: 'member', joined_at: '2026-04-01T00:00:00.000Z' },
        { id: 'member-2', role: 'admin', joined_at: '2026-04-01T00:00:00.000Z' }
      ], 'member-1')
    ).toEqual([{ id: 'member-2', role: 'admin', joined_at: '2026-04-01T00:00:00.000Z' }])

    expect(
      updateAdminCommunityRequestStatus(
        [{ id: 'request-1', status: 'pending', created_at: '2026-04-01T00:00:00.000Z' }],
        'request-1',
        'approved'
      )
    ).toEqual([{ id: 'request-1', status: 'approved', created_at: '2026-04-01T00:00:00.000Z' }])

    expect(
      removeAdminCommunityPost([
        { id: 'post-1', content: 'hola', created_at: '2026-04-01T00:00:00.000Z' },
        { id: 'post-2', content: 'adios', created_at: '2026-04-01T00:00:00.000Z' }
      ], 'post-1')
    ).toEqual([{ id: 'post-2', content: 'adios', created_at: '2026-04-01T00:00:00.000Z' }])

    expect(
      toggleAdminCommunityPostBoolean(
        [{ id: 'post-1', content: 'hola', created_at: '2026-04-01T00:00:00.000Z', is_hidden: false }],
        'post-1',
        'is_hidden'
      )
    ).toEqual([{ id: 'post-1', content: 'hola', created_at: '2026-04-01T00:00:00.000Z', is_hidden: true }])
  })
})
