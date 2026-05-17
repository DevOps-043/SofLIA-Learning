import { Check } from 'lucide-react'
import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessPanelTheme, BusinessT } from './types'
import { getUserDisplayName } from './utils'

export function UserCard({ alreadyAssignedUserIds, handleToggleUser, selectedUserIds, t, theme, user }: {
  alreadyAssignedUserIds: Set<string>
  handleToggleUser: (userId: string) => void
  selectedUserIds: Set<string>
  t: BusinessT
  theme: BusinessPanelTheme
  user: BusinessUser
}) {
  const isSelected = selectedUserIds.has(user.id)
  const isAlreadyAssigned = alreadyAssignedUserIds.has(user.id)
  const displayName = getUserDisplayName(user)

  return (
    <button type="button" disabled={isAlreadyAssigned} onClick={() => handleToggleUser(user.id)} className="rounded-[1.5rem] border p-4 text-left transition disabled:cursor-not-allowed" style={{ backgroundColor: isSelected ? theme.actionSurface : theme.cardBg, borderColor: isSelected ? theme.primaryColor : theme.borderColor, opacity: isAlreadyAssigned ? 0.55 : 1 }}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black" style={{ backgroundColor: isSelected ? theme.primaryColor : theme.inputBg, color: isSelected ? theme.onPrimaryColor : theme.textColor }}>{displayName.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: theme.textColor }}>{displayName}</p>
              <p className="truncate text-xs" style={{ color: theme.subtextColor }}>{user.email}</p>
            </div>
            {isSelected ? <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}><Check className="h-3.5 w-3.5" /></div> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {isAlreadyAssigned ? <Badge label={t('assignLearningPath.alreadyAssigned', { defaultValue: 'Ya asignado' })} theme={theme} /> : null}
            {user.job_title ? <Badge label={user.job_title} theme={theme} /> : null}
          </div>
        </div>
      </div>
    </button>
  )
}

function Badge({ label, theme }: { label: string; theme: BusinessPanelTheme }) {
  return <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}>{label}</span>
}
