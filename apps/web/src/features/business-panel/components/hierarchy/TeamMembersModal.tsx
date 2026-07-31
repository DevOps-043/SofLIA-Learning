'use client'

import { UsersRound, X } from 'lucide-react'
import { AvailableUsersList } from './TeamMembersModal/AvailableUsersList'
import { CurrentMembersList } from './TeamMembersModal/CurrentMembersList'
import { TeamMembersMessages } from './TeamMembersModal/Messages'
import type { TeamMembersModalProps } from './TeamMembersModal/types'
import { useTeamMembersModalLogic } from './TeamMembersModal/useTeamMembersModalLogic'
import { useHierarchyDialog } from './useHierarchyDialog'
import styles from './HierarchyExperience.module.css'

export function TeamMembersModal(props: TeamMembersModalProps) {
  const { currentMembers, isOpen, onClose, onMembersUpdated, teamId, teamName } = props
  const logic = useTeamMembersModalLogic({ currentMembers, isOpen, onMembersUpdated, teamId })
  const isBusy = logic.isAssigning || Boolean(logic.isRemoving)
  const dialogRef = useHierarchyDialog({ isOpen, onClose, preventClose: isBusy })

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialogWide}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-members-title"
      >
        <header className={styles.dialogHeader}>
          <span className={styles.dialogIcon}><UsersRound aria-hidden="true" /></span>
          <div className={styles.dialogHeading}>
            <p className={styles.dialogKicker}>Personas y acceso</p>
            <h2 id="team-members-title" className={styles.dialogTitle}>Gestionar miembros</h2>
            <p className={styles.dialogDescription}>{teamName}</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} disabled={isBusy} aria-label="Cerrar">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.dialogBody}>
          <div className={styles.membersManagerGrid}>
            <CurrentMembersList
              currentMembers={currentMembers}
              isRemoving={logic.isRemoving}
              onChangeRole={logic.handleChangeRole}
              onRemoveMember={logic.handleRemoveMember}
            />
            <AvailableUsersList
              availableUsers={logic.availableUsers}
              isAssigning={logic.isAssigning}
              loadingUsers={logic.loadingUsers}
              onAddMembers={logic.handleAddMembers}
              onSelectAll={logic.handleSelectAll}
              onToggleUser={logic.toggleUser}
              searchTerm={logic.searchTerm}
              selectedUserIds={logic.selectedUserIds}
              setSearchTerm={logic.setSearchTerm}
              theme={logic.theme}
            />
          </div>
          <TeamMembersMessages error={logic.error} success={logic.success} />
        </div>

        <footer className={styles.dialogFooter}>
          <button type="button" className={styles.primaryButton} onClick={onClose} disabled={isBusy}>
            Listo
          </button>
        </footer>
      </div>
    </div>
  )
}
