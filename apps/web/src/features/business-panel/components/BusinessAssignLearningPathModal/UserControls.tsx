import { Search } from 'lucide-react'
import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessPanelTheme, BusinessT } from './types'

export function UserControls({ activeUsers, alreadyAssignedUserIds, allUsersSelected, handleToggleAllUsers, searchTerm, selectableUserIds, selectedUserIds, setSearchTerm, t, theme }: {
  activeUsers: BusinessUser[]
  alreadyAssignedUserIds: Set<string>
  allUsersSelected: boolean
  handleToggleAllUsers: () => void
  searchTerm: string
  selectableUserIds: string[]
  selectedUserIds: Set<string>
  setSearchTerm: (value: string) => void
  t: BusinessT
  theme: BusinessPanelTheme
}) {
  const availableCount = activeUsers.filter((user) => !alreadyAssignedUserIds.has(user.id)).length

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.mutedTextColor }} />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('assignLearningPath.searchPlaceholder', { defaultValue: 'Buscar por nombre o email...' })} className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none transition" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }} />
        </div>
        <button type="button" onClick={handleToggleAllUsers} disabled={selectableUserIds.length === 0} className="rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: allUsersSelected ? theme.actionSurface : theme.inputBg, borderColor: allUsersSelected ? theme.primaryColor : theme.borderColor, color: theme.textColor }}>
          {allUsersSelected ? t('assignLearningPath.clearSelection', { defaultValue: 'Limpiar seleccion' }) : t('assignLearningPath.selectAll', { defaultValue: 'Seleccionar visibles' })}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs" style={{ color: theme.subtextColor }}>
        <span>{t('assignLearningPath.selectedCount', { defaultValue: '{{count}} usuarios seleccionados', count: selectedUserIds.size })}</span>
        <span>{t('assignLearningPath.availableCount', { defaultValue: '{{count}} usuarios activos disponibles', count: availableCount })}</span>
      </div>
    </>
  )
}
