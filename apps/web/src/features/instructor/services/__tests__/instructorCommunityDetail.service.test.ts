import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  InstructorCommunityDetailService,
  removeCommunityMember,
  removeCommunityPost,
  replaceCommunityMemberRole,
  toggleCommunityPostBoolean,
  updateCommunityRequestStatus
} from '../instructorCommunityDetail.service'

describe('InstructorCommunityDetailService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads the aggregated instructor community detail', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ community: { id: 'community-1' }, posts: [], members: [], accessRequests: [], videos: [] }), { status: 200 })
    )

    const payload = await InstructorCommunityDetailService.getCommunityDetail('my-community')

    expect(fetchMock).toHaveBeenCalledWith('/api/instructor/communities/slug/my-community/detail')
    expect(payload.community).toMatchObject({ id: 'community-1' })
  })

  it('raises the backend message when a mutation fails', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Sin permisos' }), { status: 403 })
    )

    await expect(InstructorCommunityDetailService.removeMember('community-1', 'member-1')).rejects.toThrow('Sin permisos')
  })

  it('updates member and request collections immutably', () => {
    expect(replaceCommunityMemberRole([{ id: '1', role: 'member', joined_at: '2026-04-01' }], '1', 'admin')).toEqual([
      { id: '1', role: 'admin', joined_at: '2026-04-01' }
    ])

    expect(updateCommunityRequestStatus([{ id: '1', status: 'pending', created_at: '2026-04-01' }], '1', 'approved')).toEqual([
      { id: '1', status: 'approved', created_at: '2026-04-01' }
    ])
  })

  it('removes and toggles post collections immutably', () => {
    expect(removeCommunityMember([{ id: '1', role: 'member', joined_at: '2026-04-01' }], '1')).toEqual([])
    expect(removeCommunityPost([{ id: 'post-1', content: 'Hello', created_at: '2026-04-01' }], 'post-1')).toEqual([])
    expect(toggleCommunityPostBoolean([{ id: 'post-1', content: 'Hello', created_at: '2026-04-01', is_hidden: false }], 'post-1', 'is_hidden')).toEqual([
      { id: 'post-1', content: 'Hello', created_at: '2026-04-01', is_hidden: true }
    ])
  })
})
