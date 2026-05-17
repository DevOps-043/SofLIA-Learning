import type { BusinessUser } from '../../services/businessUsers.service'
import { AssignmentNotice } from './AssignmentNotice'
import { UserGrid } from './UserGrid'
import type { AssignmentMode, BusinessAssignmentComponentProps } from './types'

export function AssignmentContent({
  alreadyAssignedUserIds,
  assignmentMode,
  error,
  filteredUsers,
  handleToggleUser,
  isLoadingUsers,
  selectedNodeIds,
  selectedUserIds,
  t,
  theme,
  activeUsers,
}: BusinessAssignmentComponentProps & {
  activeUsers: BusinessUser[]
  alreadyAssignedUserIds: Set<string>
  assignmentMode: AssignmentMode
  error: string | null
  filteredUsers: BusinessUser[]
  handleToggleUser: (userId: string) => void
  isLoadingUsers: boolean
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
      {error ? (
        <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: `${theme.dangerColor}12`, borderColor: `${theme.dangerColor}30`, color: theme.dangerColor }}>
          {error}
        </div>
      ) : null}
      {assignmentMode !== 'users' ? (
        <AssignmentNotice theme={theme}>
          {assignmentMode === 'all'
            ? t('assignLearningPath.bulkPreviewAll', { count: activeUsers.length })
            : t('assignLearningPath.bulkPreviewNode', { count: selectedNodeIds.size })}
        </AssignmentNotice>
      ) : isLoadingUsers ? (
        <AssignmentNotice theme={theme}>{t('assignLearningPath.loading')}</AssignmentNotice>
      ) : filteredUsers.length === 0 ? (
        <AssignmentNotice theme={theme}>{t('assignLearningPath.noUsers')}</AssignmentNotice>
      ) : (
        <UserGrid
          alreadyAssignedUserIds={alreadyAssignedUserIds}
          handleToggleUser={handleToggleUser}
          selectedUserIds={selectedUserIds}
          t={t}
          theme={theme}
          users={filteredUsers}
        />
      )}
    </div>
  )
}
