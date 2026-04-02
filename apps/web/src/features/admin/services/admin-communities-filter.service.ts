import type { AdminCommunity } from './adminCommunities.service'

export function resolveAdminCommunityCategory(community: AdminCommunity) {
  if (community.visibility === 'private') {
    return 'Privada'
  }

  if (community.access_type === 'moderated') {
    return 'Moderada'
  }

  return 'Publica'
}

export function filterAdminCommunities(
  communities: AdminCommunity[],
  filters: {
    searchTerm: string
    category: string
    status: string
  }
) {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase()

  return communities.filter(community => {
    const matchesSearch = normalizedSearch.length === 0 ||
      community.name.toLowerCase().includes(normalizedSearch) ||
      community.description.toLowerCase().includes(normalizedSearch) ||
      (community.creator_name || '').toLowerCase().includes(normalizedSearch)

    const matchesCategory = filters.category === 'all' ||
      resolveAdminCommunityCategory(community) === filters.category

    const matchesStatus = filters.status === 'all' ||
      (filters.status === 'active' && community.is_active) ||
      (filters.status === 'inactive' && !community.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })
}
