import type { BusinessLearningPathHierarchyNode } from '../../services/businessLearningPaths.service'
import type { BusinessPanelTheme, BusinessT } from './types'
import modalStyles from '../ContentModal.module.css'

export function NodeControls({ handleToggleNode, hierarchyNodes, includeDescendants, selectedNodeIds, setIncludeDescendants, t }: {
  handleToggleNode: (nodeId: string) => void
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  includeDescendants: boolean
  selectedNodeIds: Set<string>
  setIncludeDescendants: (value: boolean) => void
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  return (
    <div>
      <label className={modalStyles.checkbox}>
        <input type="checkbox" checked={includeDescendants} onChange={(event) => setIncludeDescendants(event.target.checked)} />
        {t('assignLearningPath.includeDescendants')}
      </label>
      <div className={modalStyles.nodeOptions}>
        {hierarchyNodes.length === 0 ? <p className={modalStyles.notice}>{t('assignLearningPath.noNodes')}</p> : hierarchyNodes.map((node) => <NodeButton key={node.id} handleToggleNode={handleToggleNode} isSelected={selectedNodeIds.has(node.id)} node={node} />)}
      </div>
    </div>
  )
}

function NodeButton({ handleToggleNode, isSelected, node }: {
  handleToggleNode: (nodeId: string) => void
  isSelected: boolean
  node: BusinessLearningPathHierarchyNode
}) {
  return (
    <button type="button" onClick={() => handleToggleNode(node.id)} className={`${modalStyles.nodeButton} ${isSelected ? modalStyles.nodeButtonActive : ''}`} style={{ marginLeft: node.depth * 12 }}>
      <span>{node.name}</span>
      <span>{node.type}</span>
    </button>
  )
}
