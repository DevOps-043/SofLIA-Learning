'use client'

import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { InvitationCard } from './InvitationCard'
import { InvitationListRow } from './InvitationListRow'
import { ManagementTabEmptyState } from './ManagementTabEmptyState'
import styles from './UsersPanel.module.css'
import type { BusinessUsersPageLogic, BusinessUsersTheme } from './users-page.types'

interface InvitationsPanelProps {
  logic: BusinessUsersPageLogic
  theme: BusinessUsersTheme
}

export function InvitationsPanel({ logic, theme }: InvitationsPanelProps) {
  const { t } = useTranslation('business')

  if (logic.filteredInvitations.length === 0) {
    return (
      <ManagementTabEmptyState
        key="empty-invitations"
        theme={theme}
        icon={<Mail className="h-16 w-16" />}
        title="No hay invitaciones pendientes"
        description="Las invitaciones activas aparecerán aquí para que puedas darles seguimiento."
      />
    )
  }

  if (logic.viewMode === 'cards') {
    return (
      <motion.div animate={{ opacity: 1 }} className={styles.cardGrid} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="grid-invitations">
        {logic.filteredInvitations.map((invitation, index) => (
          <InvitationCard
            index={index}
            invitation={invitation}
            key={invitation.id}
            onResend={() => logic.handleResendIndividualInvitation(invitation.id)}
            onRevoke={() => logic.handleRevokeInvitation(invitation.id)}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div animate={{ opacity: 1 }} className={styles.managementList} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="list-invitations">
      <div className={`${styles.managementListHeader} ${styles.invitationListHeader}`}>
        <span>{t('users.list.invitation', 'Invitación')}</span>
        <span>{t('users.list.sent', 'Enviada')}</span>
        <span>{t('users.list.expires', 'Vencimiento')}</span>
        <span>{t('users.list.status', 'Estado')}</span>
        <span>Acciones</span>
      </div>
      {logic.filteredInvitations.map((invitation, index) => (
        <InvitationListRow
          index={index}
          invitation={invitation}
          key={invitation.id}
          onResend={() => logic.handleResendIndividualInvitation(invitation.id)}
          onRevoke={() => logic.handleRevokeInvitation(invitation.id)}
        />
      ))}
    </motion.div>
  )
}
