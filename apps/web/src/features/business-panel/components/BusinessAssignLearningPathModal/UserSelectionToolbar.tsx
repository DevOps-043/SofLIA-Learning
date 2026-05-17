import { Search } from 'lucide-react'
import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessAssignmentComponentProps } from './types'

export function UserSelectionToolbar({
  activeUsers,
  alreadyAssignedUserIds,
  allUsersSelected,
  handleToggleAllUsers,
  searchTerm,
  selectedUserIds,
  selectableCount,
  setSearchTerm,
  t,
  theme,
}: BusinessAssignmentComponentProps & {
  activeUsers: BusinessUser[]
  alreadyAssignedUserIds: Set<string>
  allUsersSelected: boolean
  handleToggleAllUsers: () => void
  searchTerm: string
  selectedUserIds: Set<string>
  selectableCount: number
  setSearchTerm: (value: string) => void
}) {
  const availableCount = activeUsers.filter((user) => !alreadyAssignedUserIds.has(user.id)).length

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.mutedTextColor }} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('assignLearningPath.searchPlaceholder')}
            className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none transition"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          />
        </div>
        <button
          type="button"
          onClick={handleToggleAllUsers}
          disabled={selectableCount === 0}
          className="rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: allUsersSelected ? theme.actionSurface : theme.inputBg,
            borderColor: allUsersSelected ? theme.primaryColor : theme.borderColor,
            color: theme.textColor,
          }}
        >
          {allUsersSelected ? t('assignLearningPath.clearSelection') : t('assignLearningPath.selectAll')}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs" style={{ color: theme.subtextColor }}>
        <span>{t('assignLearningPath.selectedCount', { count: selectedUserIds.size })}</span>
        <span>{t('assignLearningPath.availableCount', { count: availableCount })}</span>
      </div>
    </>
  )
}
