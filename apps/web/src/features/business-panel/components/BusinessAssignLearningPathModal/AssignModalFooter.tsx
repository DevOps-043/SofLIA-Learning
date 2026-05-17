import type { BusinessUser } from '../../services/businessUsers.service'
import type { AssignmentMode, BusinessAssignmentComponentProps } from './types'

export function AssignModalFooter({
  activeUsers,
  assignmentMode,
  handleAssign,
  isAssigning,
  onClose,
  selectedNodeIds,
  selectedUserIds,
  t,
  theme,
}: BusinessAssignmentComponentProps & {
  activeUsers: BusinessUser[]
  assignmentMode: AssignmentMode
  handleAssign: () => Promise<void>
  isAssigning: boolean
  onClose: () => void
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
}) {
  const disabled =
    isAssigning ||
    (assignmentMode === 'users' && selectedUserIds.size === 0) ||
    (assignmentMode === 'node' && selectedNodeIds.size === 0)

  return (
    <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8" style={{ borderColor: theme.borderColor }}>
      <p className="text-sm" style={{ color: theme.subtextColor }}>
        {t('assignLearningPath.footerNote')}
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="rounded-2xl border px-5 py-3 text-sm font-semibold transition" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
          {t('assignLearningPath.cancel')}
        </button>
        <button
          type="button"
          onClick={() => void handleAssign()}
          disabled={disabled}
          className="rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
        >
          {isAssigning
            ? t('assignLearningPath.assigning')
            : t('assignLearningPath.confirm', { count: resolveAssignmentCount(assignmentMode, selectedUserIds, selectedNodeIds, activeUsers) })}
        </button>
      </div>
    </div>
  )
}

function resolveAssignmentCount(
  assignmentMode: AssignmentMode,
  selectedUserIds: Set<string>,
  selectedNodeIds: Set<string>,
  activeUsers: BusinessUser[],
) {
  if (assignmentMode === 'users') return selectedUserIds.size
  if (assignmentMode === 'all') return activeUsers.length
  return selectedNodeIds.size
}
