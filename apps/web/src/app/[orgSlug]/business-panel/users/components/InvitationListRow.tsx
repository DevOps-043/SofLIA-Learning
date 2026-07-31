'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock3, Mail, RefreshCw, Shield, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BusinessInvitation } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

import styles from './UsersPanel.module.css'

interface InvitationListRowProps {
  invitation: BusinessInvitation
  index: number
  onResend: () => void
  onRevoke: () => void
}

function InvitationListRow({ invitation, index, onResend, onRevoke }: InvitationListRowProps) {
  const { t, i18n } = useTranslation('business')
  const rowStyle = { '--management-status': 'var(--users-warning)' } as CSSProperties

  return (
    <motion.article
      animate={{ opacity: 1, x: 0 }}
      className={`${styles.managementListRow} ${styles.invitationListRow}`}
      initial={{ opacity: 0, x: -10 }}
      style={rowStyle}
      transition={{ delay: index * 0.025, duration: 0.24 }}
    >
      <div className={styles.managementListIdentity}>
        <span aria-hidden="true"><Mail /></span>
        <div>
          <h3 title={invitation.email}>{invitation.email}</h3>
          <p>{formatRole(invitation.role)}</p>
        </div>
      </div>
      <div className={styles.managementListValue}>
        <Mail aria-hidden="true" />
        <span>{formatDate(invitation.created_at, i18n.language)}</span>
      </div>
      <div className={styles.managementListValue}>
        <CalendarDays aria-hidden="true" />
        <span>{formatDate(invitation.expires_at, i18n.language)}</span>
      </div>
      <span className={styles.managementStatus}>
        <Clock3 aria-hidden="true" />
        {t('users.status.pending', 'Pendiente')}
      </span>
      <div className={styles.listActions}>
        <button
          aria-label={t('users.card.resendInvite', 'Reenviar invitación')}
          className={styles.iconAction}
          onClick={onResend}
          title={t('users.card.resendInvite', 'Reenviar invitación')}
          type="button"
        >
          <RefreshCw aria-hidden="true" />
        </button>
        <button
          aria-label={t('users.card.revoke', 'Revocar invitación')}
          className={`${styles.iconAction} ${styles.dangerAction}`}
          onClick={onRevoke}
          title={t('users.card.revoke', 'Revocar invitación')}
          type="button"
        >
          <XCircle aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  )
}

function formatRole(role: string) {
  return ({ owner: 'Propietario', admin: 'Administrador', member: 'Miembro' } as Record<string, string>)[role] ?? role
}

export { InvitationListRow }
export type { InvitationListRowProps }
