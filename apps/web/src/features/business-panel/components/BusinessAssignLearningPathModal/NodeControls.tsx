import type { BusinessLearningPathHierarchyNode } from '../../services/businessLearningPaths.service'
import type { BusinessPanelTheme, BusinessT } from './types'

export function NodeControls({ handleToggleNode, hierarchyNodes, includeDescendants, selectedNodeIds, setIncludeDescendants, t, theme }: {
  handleToggleNode: (nodeId: string) => void
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  includeDescendants: boolean
  selectedNodeIds: Set<string>
  setIncludeDescendants: (value: boolean) => void
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 text-sm" style={{ color: theme.subtextColor }}>
        <input type="checkbox" checked={includeDescendants} onChange={(event) => setIncludeDescendants(event.target.checked)} />
        {t('assignLearningPath.includeDescendants')}
      </label>
      <div className="grid max-h-56 gap-2 overflow-y-auto rounded-2xl border p-3" style={{ borderColor: theme.borderColor }}>
        {hierarchyNodes.length === 0 ? <p className="px-2 py-3 text-sm" style={{ color: theme.subtextColor }}>{t('assignLearningPath.noNodes')}</p> : hierarchyNodes.map((node) => <NodeButton key={node.id} handleToggleNode={handleToggleNode} isSelected={selectedNodeIds.has(node.id)} node={node} theme={theme} />)}
      </div>
    </div>
  )
}

function NodeButton({ handleToggleNode, isSelected, node, theme }: {
  handleToggleNode: (nodeId: string) => void
  isSelected: boolean
  node: BusinessLearningPathHierarchyNode
  theme: BusinessPanelTheme
}) {
  return (
    <button type="button" onClick={() => handleToggleNode(node.id)} className="flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm" style={{ marginLeft: node.depth * 12, backgroundColor: isSelected ? theme.actionSurface : theme.cardBg, borderColor: isSelected ? theme.primaryColor : theme.borderColor, color: theme.textColor }}>
      <span className="truncate">{node.name}</span>
      <span className="text-[10px] uppercase" style={{ color: theme.subtextColor }}>{node.type}</span>
    </button>
  )
}
