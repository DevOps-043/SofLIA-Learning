import type { BusinessUser } from '../../services/businessUsers.service'
import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'
import { UserCard } from './UserCard'
import modalStyles from '../ContentModal.module.css'

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
    <div className={modalStyles.selectionBody}>
      {error ? <div className={modalStyles.errorNotice}>{error}</div> : null}
      <AssignmentBodyContent activeUsers={activeUsers} alreadyAssignedUserIds={alreadyAssignedUserIds} assignmentMode={assignmentMode} filteredUsers={filteredUsers} handleToggleUser={handleToggleUser} isLoadingUsers={isLoadingUsers} selectedNodeIds={selectedNodeIds} selectedUserIds={selectedUserIds} t={t} theme={theme} />
    </div>
  )
}

function AssignmentBodyContent(props: Omit<Parameters<typeof AssignmentBody>[0], 'error'>) {
  if (props.assignmentMode !== 'users') return <EmptyState text={props.assignmentMode === 'all' ? props.t('assignLearningPath.bulkPreviewAll', { count: props.activeUsers.length }) : props.t('assignLearningPath.bulkPreviewNode', { count: props.selectedNodeIds.size })} theme={props.theme} />
  if (props.isLoadingUsers) return <EmptyState text={props.t('assignLearningPath.loading', { defaultValue: 'Cargando usuarios...' })} theme={props.theme} />
  if (props.filteredUsers.length === 0) return <EmptyState text={props.t('assignLearningPath.noUsers', { defaultValue: 'No hay usuarios disponibles para esta ruta.' })} theme={props.theme} />
  return (
    <div className={modalStyles.userGrid}>
      {props.filteredUsers.map((user) => <UserCard key={user.id} alreadyAssignedUserIds={props.alreadyAssignedUserIds} handleToggleUser={props.handleToggleUser} selectedUserIds={props.selectedUserIds} t={props.t} theme={props.theme} user={user} />)}
    </div>
  )
}

function EmptyState({ text }: { text: string; theme: BusinessPanelTheme }) {
  return <div className={modalStyles.emptyNotice}>{text}</div>
}
