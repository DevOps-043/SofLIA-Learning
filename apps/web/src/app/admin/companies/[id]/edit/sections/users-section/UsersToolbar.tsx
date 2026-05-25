'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { CompanyUsersSubTab } from './types'
import { colors } from '../shared'

export function UsersToolbar({
  activeSubTab,
  roleFilter,
  searchTerm,
  onRoleFilterChange,
  onSearchTermChange,
}: {
  activeSubTab: CompanyUsersSubTab
  roleFilter: string
  searchTerm: string
  onRoleFilterChange: (value: string) => void
  onSearchTermChange: (value: string) => void
}) {
  const placeholder =
    activeSubTab === 'members'
      ? 'Buscar por nombre o email...'
      : activeSubTab === 'invitations'
        ? 'Buscar por email...'
        : 'Buscar por nombre o token...'

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: colors.grayMedium }} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none dark:border-white/10 dark:bg-carbon-900 dark:text-white dark:focus:border-accent"
        />
      </div>
      {activeSubTab === 'members' ? (
        <select
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none dark:border-white/10 dark:bg-carbon-900 dark:text-white dark:focus:border-accent"
        >
          <option value="all">Todos los roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Miembros</option>
        </select>
      ) : null}
    </div>
  )
}
