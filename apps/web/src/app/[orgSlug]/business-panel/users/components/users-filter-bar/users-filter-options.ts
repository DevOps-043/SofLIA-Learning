import type { FilterOption, UserManagementTab, UsersFilterBarProps } from './users-filter-bar.types'

export function buildTabs(props: Pick<UsersFilterBarProps, 't' | 'totalCounts'>) {
  const { t, totalCounts } = props
  return [
    { key: 'users' as const, label: t('users.title'), count: totalCounts.users },
    { key: 'invitations' as const, label: t('users.tabs.invitations'), count: totalCounts.invitations },
    { key: 'links' as const, label: t('users.tabs.links'), count: totalCounts.inviteLinks },
    { key: 'requests' as const, label: t('sidebar.joinRequests'), count: totalCounts.joinRequests },
  ]
}

export function getResultsCount(props: UsersFilterBarProps) {
  if (props.activeTab === 'users') return props.filteredUsers.length
  if (props.activeTab === 'invitations') return props.filteredInvitations.length
  if (props.activeTab === 'links') return props.filteredInviteLinks.length
  return props.filteredJoinRequests.length
}

export function getSearchPlaceholder(activeTab: UserManagementTab, t: UsersFilterBarProps['t']) {
  if (activeTab === 'users') return t('users.placeholders.search')
  if (activeTab === 'requests') return t('users.placeholders.searchRequests')
  if (activeTab === 'links') return t('users.placeholders.searchLinks')
  return t('users.placeholders.searchInvitations')
}

export function getRoleOptions(t: UsersFilterBarProps['t']): FilterOption[] {
  return ['all', 'owner', 'admin', 'member'].map((value) => ({ value, label: t(`users.roles.${value}`) }))
}

export function getStatusOptions(t: UsersFilterBarProps['t']): FilterOption[] {
  return ['all', 'active', 'invited', 'suspended'].map((value) => ({ value, label: t(`users.status.${value}`) }))
}

export function getCollectionOptions(values: (string | null | undefined)[], allLabel: string): FilterOption[] {
  return [{ value: 'all', label: allLabel }, ...values.filter(Boolean).map((value) => ({ value: value || '', label: value || '' }))]
}
