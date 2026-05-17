import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessLearningPathHierarchyNode } from '../../services/businessLearningPaths.service'
import { AssignmentModeSelector } from './AssignmentModeSelector'
import { NodeControls } from './NodeControls'
import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'
import { UserControls } from './UserControls'

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
    <div className="border-b px-6 py-5 sm:px-8" style={{ borderColor: props.theme.borderColor }}>
      <AssignmentModeSelector assignmentMode={props.assignmentMode} setAssignmentMode={props.setAssignmentMode} t={props.t} theme={props.theme} />
      {props.assignmentMode === 'users' ? <UserControls {...props} /> : null}
      {props.assignmentMode === 'all' ? <div className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: props.theme.inputBg, borderColor: props.theme.borderColor, color: props.theme.subtextColor }}>{props.t('assignLearningPath.allUsersHint', { count: props.activeUsers.length })}</div> : null}
      {props.assignmentMode === 'node' ? <NodeControls {...props} /> : null}
    </div>
  )
}
