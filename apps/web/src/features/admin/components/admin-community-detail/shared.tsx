import type { AdminPanelThemeTokens } from '../../hooks/useAdminPanelTheme'

export interface DetailBadgeConfig {
  bg: string
  border: string
  color: string
  labelKey?: string
}

export function getCommunityDetailCategoryConfig(
  visibility: string,
  accessType: string,
  theme: AdminPanelThemeTokens,
): DetailBadgeConfig {
  if (visibility === 'private') {
    return {
      bg: `${theme.warningColor}14`,
      border: `${theme.warningColor}26`,
      color: theme.warningColor,
      labelKey: 'communityCard.typePrivate',
    }
  }

  if (accessType === 'moderated') {
    return {
      bg: `${theme.secondaryColor}14`,
      border: `${theme.secondaryColor}26`,
      color: theme.secondaryColor,
      labelKey: 'communityCard.typeModerated',
    }
  }

  return {
    bg: `${theme.successColor}14`,
    border: `${theme.successColor}26`,
    color: theme.successColor,
    labelKey: 'communityCard.typePublic',
  }
}

export function getCommunityDetailStatusConfig(
  isActive: boolean,
  theme: AdminPanelThemeTokens,
): DetailBadgeConfig {
  return isActive
    ? {
        bg: `${theme.successColor}14`,
        border: `${theme.successColor}26`,
        color: theme.successColor,
        labelKey: 'communityCard.statusActive',
      }
    : {
        bg: theme.inputBg,
        border: theme.borderColor,
        color: theme.subtextColor,
        labelKey: 'communityCard.statusInactive',
      }
}

export function getCommunityDetailRoleConfig(
  role: string,
  theme: AdminPanelThemeTokens,
): DetailBadgeConfig {
  if (role === 'admin') {
    return {
      bg: `${theme.primaryColor}14`,
      border: `${theme.primaryColor}26`,
      color: theme.primaryColor,
    }
  }

  if (role === 'moderator') {
    return {
      bg: `${theme.secondaryColor}14`,
      border: `${theme.secondaryColor}26`,
      color: theme.secondaryColor,
    }
  }

  return {
    bg: theme.inputBg,
    border: theme.borderColor,
    color: theme.subtextColor,
  }
}

export function getCommunityDetailRequestStatusConfig(
  status: string,
  theme: AdminPanelThemeTokens,
): DetailBadgeConfig {
  if (status === 'approved') {
    return {
      bg: `${theme.successColor}14`,
      border: `${theme.successColor}26`,
      color: theme.successColor,
    }
  }

  if (status === 'rejected') {
    return {
      bg: `${theme.dangerColor}14`,
      border: `${theme.dangerColor}26`,
      color: theme.dangerColor,
    }
  }

  return {
    bg: `${theme.warningColor}14`,
    border: `${theme.warningColor}26`,
    color: theme.warningColor,
  }
}

export function formatCommunityDetailDate(value?: string | null) {
  if (!value) {
    return null
  }

  return new Date(value).toLocaleDateString()
}
