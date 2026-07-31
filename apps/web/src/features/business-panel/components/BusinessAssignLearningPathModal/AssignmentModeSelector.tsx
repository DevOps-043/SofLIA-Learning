import { Building2, GitBranch, Users } from 'lucide-react'
import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'
import modalStyles from '../ContentModal.module.css'

export function AssignmentModeSelector({ assignmentMode, setAssignmentMode, t }: {
  assignmentMode: AssignmentMode
  setAssignmentMode: (mode: AssignmentMode) => void
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  const items = [
    { mode: 'users' as const, icon: Users, label: t('assignLearningPath.modes.users') },
    { mode: 'all' as const, icon: Building2, label: t('assignLearningPath.modes.all') },
    { mode: 'node' as const, icon: GitBranch, label: t('assignLearningPath.modes.node') },
  ]

  return (
    <div aria-label="Modo de asignación" className={modalStyles.modeTabs} role="tablist">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = assignmentMode === item.mode
        return (
          <button aria-selected={isActive} className={`${modalStyles.modeTab} ${isActive ? modalStyles.modeTabActive : ''}`} key={item.mode} onClick={() => setAssignmentMode(item.mode)} role="tab" type="button">
            <Icon aria-hidden="true" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
