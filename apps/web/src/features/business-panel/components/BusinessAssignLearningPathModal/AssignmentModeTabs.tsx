import { Building2, GitBranch, Users } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { AssignmentMode, BusinessAssignmentComponentProps } from './types'

export function AssignmentModeTabs({
  assignmentMode,
  setAssignmentMode,
  t,
  theme,
}: BusinessAssignmentComponentProps & {
  assignmentMode: AssignmentMode
  setAssignmentMode: Dispatch<SetStateAction<AssignmentMode>>
}) {
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-3">
      {[
        { mode: 'users' as const, icon: Users, label: t('assignLearningPath.modes.users') },
        { mode: 'all' as const, icon: Building2, label: t('assignLearningPath.modes.all') },
        { mode: 'node' as const, icon: GitBranch, label: t('assignLearningPath.modes.node') },
      ].map((item) => {
        const Icon = item.icon
        const isActive = assignmentMode === item.mode
        return (
          <button
            key={item.mode}
            type="button"
            onClick={() => setAssignmentMode(item.mode)}
            className="flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-wider"
            style={{
              backgroundColor: isActive ? theme.actionSurface : theme.inputBg,
              borderColor: isActive ? theme.primaryColor : theme.borderColor,
              color: theme.textColor,
            }}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
