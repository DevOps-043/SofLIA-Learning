'use client'

import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { InvitationCard } from './InvitationCard'
import { InvitationListRow } from './InvitationListRow'
import { ManagementTabEmptyState } from './ManagementTabEmptyState'
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
        description="Todas tus invitaciones han sido aceptadas o no has enviado ninguna recientemente."
      />
    )
  }

  if (logic.viewMode === 'cards') {
    return (
      <motion.div key="grid-invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {logic.filteredInvitations.map((invitation, index) => (
          <InvitationCard
            key={invitation.id}
            invitation={invitation}
            index={index}
            onResend={() => logic.handleResendIndividualInvitation(invitation.id)}
            onRevoke={() => logic.handleRevokeInvitation(invitation.id)}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div key="list-invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
      <div className="hidden grid-cols-5 gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider opacity-50 lg:grid">
        <div className="col-span-2">{t('users.list.invitation', 'Invitacion')}</div>
        <div>{t('users.list.sent', 'Enviada')}</div>
        <div>{t('users.list.status', 'Estado')}</div>
        <div className="text-right">Acciones</div>
      </div>
      {logic.filteredInvitations.map((invitation, index) => (
        <InvitationListRow
          key={invitation.id}
          invitation={invitation}
          index={index}
          onResend={() => logic.handleResendIndividualInvitation(invitation.id)}
          onRevoke={() => logic.handleRevokeInvitation(invitation.id)}
        />
      ))}
    </motion.div>
  )
}
