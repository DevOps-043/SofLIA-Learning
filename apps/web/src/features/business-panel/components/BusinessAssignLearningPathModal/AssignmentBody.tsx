import type { BusinessUser } from '../../services/businessUsers.service'
import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'
import { UserCard } from './UserCard'

export function AssignmentBody({ activeUsers, alreadyAssignedUserIds, assignmentMode, error, filteredUsers, handleToggleUser, isLoadingUsers, selectedNodeIds, selectedUserIds, t, theme }: {
  activeUsers: BusinessUser[]
  alreadyAssignedUserIds: Set<string>
  assignmentMode: AssignmentMode
  error: string | null
  filteredUsers: BusinessUser[]
  handleToggleUser: (userId: string) => void
  isLoadingUsers: boolean
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
      {error ? <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: theme.dangerColor + '12', borderColor: theme.dangerColor + '30', color: theme.dangerColor }}>{error}</div> : null}
      <AssignmentBodyContent activeUsers={activeUsers} alreadyAssignedUserIds={alreadyAssignedUserIds} assignmentMode={assignmentMode} filteredUsers={filteredUsers} handleToggleUser={handleToggleUser} isLoadingUsers={isLoadingUsers} selectedNodeIds={selectedNodeIds} selectedUserIds={selectedUserIds} t={t} theme={theme} />
    </div>
  )
}

function AssignmentBodyContent(props: Omit<Parameters<typeof AssignmentBody>[0], 'error'>) {
  if (props.assignmentMode !== 'users') return <EmptyState text={props.assignmentMode === 'all' ? props.t('assignLearningPath.bulkPreviewAll', { count: props.activeUsers.length }) : props.t('assignLearningPath.bulkPreviewNode', { count: props.selectedNodeIds.size })} theme={props.theme} />
  if (props.isLoadingUsers) return <EmptyState text={props.t('assignLearningPath.loading', { defaultValue: 'Cargando usuarios...' })} theme={props.theme} />
  if (props.filteredUsers.length === 0) return <EmptyState text={props.t('assignLearningPath.noUsers', { defaultValue: 'No hay usuarios disponibles para esta ruta.' })} theme={props.theme} />
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {props.filteredUsers.map((user) => <UserCard key={user.id} alreadyAssignedUserIds={props.alreadyAssignedUserIds} handleToggleUser={props.handleToggleUser} selectedUserIds={props.selectedUserIds} t={props.t} theme={props.theme} user={user} />)}
    </div>
  )
}

function EmptyState({ text, theme }: { text: string; theme: BusinessPanelTheme }) {
  return <div className="rounded-3xl border border-dashed px-6 py-12 text-center text-sm" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>{text}</div>
}
