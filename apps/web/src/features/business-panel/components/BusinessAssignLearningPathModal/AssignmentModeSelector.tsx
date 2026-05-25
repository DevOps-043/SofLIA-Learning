import { Building2, GitBranch, Users } from 'lucide-react'
import type { AssignmentMode, BusinessPanelTheme, BusinessT } from './types'

export function AssignmentModeSelector({ assignmentMode, setAssignmentMode, t, theme }: {
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
    <div className="mb-4 grid gap-2 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = assignmentMode === item.mode
        return (
          <button key={item.mode} type="button" onClick={() => setAssignmentMode(item.mode)} className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-wider" style={{ backgroundColor: isActive ? theme.actionSurface : theme.inputBg, borderColor: isActive ? theme.primaryColor : theme.borderColor, color: theme.textColor }}>
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
