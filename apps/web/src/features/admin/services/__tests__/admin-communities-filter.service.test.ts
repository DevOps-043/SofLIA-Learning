import { describe, expect, it } from 'vitest'
import { filterAdminCommunities, resolveAdminCommunityCategory } from '../admin-communities-filter.service'
import type { AdminCommunity } from '../adminCommunities.service'

const baseCommunity: AdminCommunity = {
  id: 'community-1',
  name: 'Community One',
  description: 'Description',
  slug: 'community-one',
  member_count: 10,
  is_active: true,
  visibility: 'public',
  access_type: 'open',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  creator_name: 'Admin User'
}

describe('admin-communities-filter.service', () => {
  it('resolves category labels from visibility and access type', () => {
    expect(resolveAdminCommunityCategory(baseCommunity)).toBe('Publica')
    expect(resolveAdminCommunityCategory({ ...baseCommunity, visibility: 'private' })).toBe('Privada')
    expect(resolveAdminCommunityCategory({ ...baseCommunity, access_type: 'moderated' })).toBe('Moderada')
  })

  it('filters by search term across name, description and creator', () => {
    const communities = [
      baseCommunity,
      { ...baseCommunity, id: 'community-2', name: 'Other', creator_name: 'Jane Doe' },
    ]

    expect(filterAdminCommunities(communities, {
      searchTerm: 'jane',
      category: 'all',
      status: 'all'
    })).toHaveLength(1)
  })

  it('filters by category and status together', () => {
    const communities = [
      { ...baseCommunity, id: 'public-active' },
      { ...baseCommunity, id: 'private-active', visibility: 'private' },
      { ...baseCommunity, id: 'private-inactive', visibility: 'private', is_active: false },
    ]

    const result = filterAdminCommunities(communities, {
      searchTerm: '',
      category: 'Privada',
      status: 'inactive'
    })

    expect(result.map(community => community.id)).toEqual(['private-inactive'])
  })
})
