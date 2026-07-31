'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { EmptyState } from './EmptyState'
import { UserCard } from './UserCard'
import { UserListRow } from './UserListRow'
import styles from './UsersPanel.module.css'
import type { BusinessUsersPageLogic } from './users-page.types'

interface UsersListPanelProps {
  logic: BusinessUsersPageLogic
}

export function UsersListPanel({ logic }: UsersListPanelProps) {
  const { t } = useTranslation('business')

  if (logic.filteredUsers.length === 0) {
    return <EmptyState key="empty-users" onAddClick={() => logic.setIsAddModalOpen(true)} />
  }

  if (logic.viewMode === 'cards') {
    return (
      <motion.div
        key="grid-users"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.cardGrid}
      >
        {logic.filteredUsers.map((user, index) => (
          <UserCard
            key={user.id}
            user={user}
            index={index}
            onEdit={() => openEdit(logic, user)}
            onDelete={() => openDelete(logic, user)}
            onStats={() => openStats(logic, user)}
            onResend={user.org_status === 'invited' ? () => logic.resendInvitation(user.id) : undefined}
            onSuspend={user.org_status === 'active' ? () => logic.suspendUser(user.id) : undefined}
            onActivate={user.org_status === 'suspended' ? () => logic.activateUser(user.id) : undefined}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div key="list-users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.list}>
      <div className={styles.listHeader} aria-hidden="true">
        <span>{t('users.list.name', 'Nombre')}</span>
        <span>{t('users.list.hierarchy', 'Ubicación')}</span>
        <span>{t('users.list.role', 'Rol / Estado')}</span>
        <span>{t('users.list.lastAccess', 'Último acceso')}</span>
        <span>{t('users.list.actions', 'Acciones')}</span>
      </div>
      {logic.filteredUsers.map((user, index) => (
        <UserListRow
          key={user.id}
          user={user}
          index={index}
          onEdit={() => openEdit(logic, user)}
          onDelete={() => openDelete(logic, user)}
          onStats={() => openStats(logic, user)}
          onResend={user.org_status === 'invited' ? () => logic.resendInvitation(user.id) : undefined}
        />
      ))}
    </motion.div>
  )
}

function openEdit(logic: BusinessUsersPageLogic, user: BusinessUsersPageLogic['filteredUsers'][number]) {
  logic.setEditingUser(user)
  logic.setIsEditModalOpen(true)
}

function openDelete(logic: BusinessUsersPageLogic, user: BusinessUsersPageLogic['filteredUsers'][number]) {
  logic.setDeletingUser(user)
  logic.setIsDeleteModalOpen(true)
}

function openStats(logic: BusinessUsersPageLogic, user: BusinessUsersPageLogic['filteredUsers'][number]) {
  logic.setStatsUser(user)
  logic.setIsStatsModalOpen(true)
}
