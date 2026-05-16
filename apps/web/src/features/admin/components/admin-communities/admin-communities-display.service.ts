import type { AdminCommunity } from '../../services/adminCommunities.service'

export interface AdminCommunityDisplayTheme {
  primaryColor: string
  successColor: string
  warningColor: string
  dangerColor: string
  secondaryColor: string
  mutedTextColor: string
  inputBg: string
  borderColor: string
}

export interface AdminCommunityBadgeConfig {
  labelKey: string
  color: string
  bg: string
  border: string
}

export const ADMIN_COMMUNITY_CATEGORY_OPTIONS = [
  { value: 'all', labelKey: 'communities.filters.categories.all' },
  { value: 'Publica', labelKey: 'communities.filters.categories.public' },
  { value: 'Privada', labelKey: 'communities.filters.categories.private' },
  { value: 'Moderada', labelKey: 'communities.filters.categories.moderated' },
] as const

export const ADMIN_COMMUNITY_STATUS_OPTIONS = [
  { value: 'all', labelKey: 'communities.filters.status.all' },
  { value: 'active', labelKey: 'communities.filters.status.active' },
  { value: 'inactive', labelKey: 'communities.filters.status.inactive' },
] as const

export function getAdminCommunityTypeConfig(
  community: Pick<AdminCommunity, 'visibility' | 'access_type'>,
  theme: AdminCommunityDisplayTheme,
): AdminCommunityBadgeConfig {
  if (community.visibility === 'private') {
    return {
      labelKey: 'communityCard.typePrivate',
      color: theme.warningColor,
      bg: `${theme.warningColor}14`,
      border: `${theme.warningColor}26`,
    }
  }

  if (community.access_type === 'moderated') {
    return {
      labelKey: 'communityCard.typeModerated',
      color: theme.secondaryColor,
      bg: `${theme.secondaryColor}14`,
      border: `${theme.secondaryColor}26`,
    }
  }

  return {
    labelKey: 'communityCard.typePublic',
    color: theme.successColor,
    bg: `${theme.successColor}14`,
    border: `${theme.successColor}26`,
  }
}

export function getAdminCommunityStatusConfig(
  isActive: boolean,
  theme: AdminCommunityDisplayTheme,
): AdminCommunityBadgeConfig {
  return isActive
    ? {
        labelKey: 'communityCard.statusActive',
        color: theme.successColor,
        bg: `${theme.successColor}14`,
        border: `${theme.successColor}26`,
      }
    : {
        labelKey: 'communityCard.statusInactive',
        color: theme.mutedTextColor,
        bg: theme.inputBg,
        border: theme.borderColor,
      }
}

export function getAdminCommunityCreatorInitial(name?: string | null) {
  return (name?.trim()?.[0] || 'A').toUpperCase()
}
