import Image from 'next/image'
import { Check, Loader2, Search, UserRoundPlus, Users } from 'lucide-react'
import type { AvailableTeamUser, TeamMembersTheme } from './types'
import styles from '../HierarchyExperience.module.css'

interface AvailableUsersListProps {
  availableUsers: AvailableTeamUser[]
  isAssigning: boolean
  loadingUsers: boolean
  onAddMembers: () => void
  onSelectAll: () => void
  onToggleUser: (userId: string) => void
  searchTerm: string
  selectedUserIds: Set<string>
  setSearchTerm: (value: string) => void
  theme: TeamMembersTheme
}

export function AvailableUsersList({
  availableUsers,
  isAssigning,
  loadingUsers,
  onAddMembers,
  onSelectAll,
  onToggleUser,
  searchTerm,
  selectedUserIds,
  setSearchTerm,
}: AvailableUsersListProps) {
  const allSelected = availableUsers.length > 0 && availableUsers.every((user) => selectedUserIds.has(user.id))

  return (
    <section className={styles.membersManagerColumn}>
      <div className={styles.membersManagerHeading}>
        <div>
          <p className={styles.sectionKicker}>Directorio</p>
          <h3 className={styles.membersManagerTitle}>Personas disponibles</h3>
        </div>
        {availableUsers.length ? (
          <button type="button" className={styles.textButton} onClick={onSelectAll}>
            {allSelected ? 'Deseleccionar' : 'Seleccionar todo'}
          </button>
        ) : null}
      </div>

      <label className={styles.searchField}>
        <Search aria-hidden="true" />
        <span className={styles.srOnly}>Buscar usuarios</span>
        <input
          type="search"
          placeholder="Buscar por nombre o correo…"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={styles.input}
        />
      </label>

      <div className={styles.membersManagerList}>
        {loadingUsers ? (
          <div className={styles.compactEmptyState}>
            <Loader2 className={styles.spin} aria-hidden="true" />
            <strong>Consultando el directorio…</strong>
          </div>
        ) : availableUsers.length === 0 ? (
          <div className={styles.compactEmptyState}>
            <span className={styles.stateIcon}><Users aria-hidden="true" /></span>
            <strong>No hay personas disponibles</strong>
            <span>Todos los usuarios ya pertenecen a este equipo.</span>
          </div>
        ) : availableUsers.map((user) => {
          const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
          const isSelected = selectedUserIds.has(user.id)
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onToggleUser(user.id)}
              className={styles.resultRow}
              data-selected={isSelected}
              aria-pressed={isSelected}
            >
              <span className={styles.memberAvatar}>
                {user.profile_picture_url ? (
                  <Image src={user.profile_picture_url} alt="" fill className={styles.memberAvatarImage} sizes="38px" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </span>
              <span className={styles.resultCopy}>
                <strong>{displayName}</strong>
                <span>{user.email}</span>
              </span>
              <span className={styles.resultCheck} data-selected={isSelected}>
                <Check aria-hidden="true" />
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onAddMembers}
        disabled={selectedUserIds.size === 0 || isAssigning}
        className={styles.primaryButton}
      >
        {isAssigning ? <Loader2 className={styles.spin} aria-hidden="true" /> : <UserRoundPlus aria-hidden="true" />}
        {isAssigning ? 'Agregando…' : `Agregar${selectedUserIds.size ? ` (${selectedUserIds.size})` : ''}`}
      </button>
    </section>
  )
}
