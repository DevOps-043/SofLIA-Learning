'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock3, Mail, RefreshCw, Shield, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BusinessInvitation } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

import styles from './UsersPanel.module.css'

interface InvitationCardProps {
  invitation: BusinessInvitation
  index: number
  onResend: () => void
  onRevoke: () => void
}

function InvitationCard({ invitation, index, onResend, onRevoke }: InvitationCardProps) {
  const { t, i18n } = useTranslation('business')
  const cardStyle = { '--management-status': 'var(--users-warning)' } as CSSProperties

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={styles.managementCard}
      initial={{ opacity: 0, y: 16 }}
      style={cardStyle}
      transition={{ delay: index * 0.035, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className={styles.managementCardHeader}>
        <span className={styles.managementIcon} aria-hidden="true">
          <Mail />
        </span>
        <div className={styles.managementIdentity}>
          <p className={styles.managementEyebrow}>
            {t('users.list.invitation', 'Invitación individual')}
          </p>
          <h3 className={styles.managementTitle} title={invitation.email}>
            {invitation.email}
          </h3>
        </div>
        <span className={styles.managementStatus}>
          <Clock3 aria-hidden="true" />
          {t('users.status.pending', 'Pendiente')}
        </span>
      </header>

      <div className={styles.managementDivider} />

      <dl className={styles.managementMeta}>
        <div className={styles.managementMetaItem}>
          <Shield aria-hidden="true" />
          <dt>{t('users.modals.delete.fields.role', 'Rol')}</dt>
          <dd>{formatRole(invitation.role)}</dd>
        </div>
        <div className={styles.managementMetaItem}>
          <Mail aria-hidden="true" />
          <dt>{t('users.card.sent', 'Enviada')}</dt>
          <dd>{formatDate(invitation.created_at, i18n.language)}</dd>
        </div>
        <div className={styles.managementMetaItem}>
          <CalendarDays aria-hidden="true" />
          <dt>{t('users.card.expires', 'Vence')}</dt>
          <dd>{formatDate(invitation.expires_at, i18n.language)}</dd>
        </div>
      </dl>

      <footer className={styles.managementActions}>
        <button className={styles.cardPrimaryAction} onClick={onResend} type="button">
          <RefreshCw aria-hidden="true" />
          {t('users.card.resendInvite', 'Reenviar invitación')}
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
      </footer>
    </motion.article>
  )
}

function formatRole(role: string) {
  const labels: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    member: 'Miembro',
  }

  return labels[role] ?? role
}

export { InvitationCard }
export type { InvitationCardProps }
