import { Search } from 'lucide-react'
import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessPanelTheme, BusinessT } from './types'
import modalStyles from '../ContentModal.module.css'

export function UserControls({ activeUsers, alreadyAssignedUserIds, allUsersSelected, handleToggleAllUsers, searchTerm, selectableUserIds, selectedUserIds, setSearchTerm, t }: {
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
      <div className={modalStyles.toolbar}>
        <div className={modalStyles.search}>
          <Search aria-hidden="true" />
          <input aria-label="Buscar usuario" className={modalStyles.input} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('assignLearningPath.searchPlaceholder', { defaultValue: 'Buscar por nombre o email...' })} />
        </div>
        <button type="button" onClick={handleToggleAllUsers} disabled={selectableUserIds.length === 0} className={modalStyles.secondaryButton}>
          {allUsersSelected ? t('assignLearningPath.clearSelection', { defaultValue: 'Limpiar selección' }) : t('assignLearningPath.selectAll', { defaultValue: 'Seleccionar visibles' })}
        </button>
      </div>
      <div className={modalStyles.selectionMeta}>
        <span>{t('assignLearningPath.selectedCount', { defaultValue: '{{count}} usuarios seleccionados', count: selectedUserIds.size })}</span>
        <span>{t('assignLearningPath.availableCount', { defaultValue: '{{count}} usuarios activos disponibles', count: availableCount })}</span>
      </div>
    </>
  )
}
