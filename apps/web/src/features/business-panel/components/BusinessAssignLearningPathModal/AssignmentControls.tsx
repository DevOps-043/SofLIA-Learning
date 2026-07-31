import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessLearningPathHierarchyNode } from '../../services/businessLearningPaths.service'
import { AssignmentModeSelector } from './AssignmentModeSelector'
import { NodeControls } from './NodeControls'
import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'
import { UserControls } from './UserControls'
import modalStyles from '../ContentModal.module.css'

export function AssignmentControls(props: {
  activeUsers: BusinessUser[]
  alreadyAssignedUserIds: Set<string>
  allUsersSelected: boolean
  assignmentMode: AssignmentMode
  handleToggleAllUsers: () => void
  handleToggleNode: (nodeId: string) => void
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  includeDescendants: boolean
  searchTerm: string
  selectableUserIds: string[]
  selectedNodeIds: Set<string>
  selectedUserIds: Set<string>
  setAssignmentMode: (mode: AssignmentMode) => void
  setIncludeDescendants: (value: boolean) => void
  setSearchTerm: (value: string) => void
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  return (
    <div className={modalStyles.controls}>
      <AssignmentModeSelector assignmentMode={props.assignmentMode} setAssignmentMode={props.setAssignmentMode} t={props.t} theme={props.theme} />
      {props.assignmentMode === 'users' ? <UserControls {...props} /> : null}
      {props.assignmentMode === 'all' ? <div className={modalStyles.notice}>{props.t('assignLearningPath.allUsersHint', { count: props.activeUsers.length })}</div> : null}
      {props.assignmentMode === 'node' ? <NodeControls {...props} /> : null}
    </div>
  )
}
