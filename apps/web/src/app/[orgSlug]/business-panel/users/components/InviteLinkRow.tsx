'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Link2, Pause, Play, Trash2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

import styles from './UsersPanel.module.css'

interface InviteLinkRowProps {
  link: BulkInviteLink
  index: number
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkRow({ link, index, onToggleStatus, onDelete }: InviteLinkRowProps) {
  const { t, i18n } = useTranslation('business')
  const usagePercent = Math.min(100, (link.current_uses / Math.max(link.max_uses, 1)) * 100)
  const statusColor = link.status === 'active'
    ? 'var(--users-success)'
    : link.status === 'paused'
      ? 'var(--users-warning)'
      : 'var(--users-danger)'
  const rowStyle = {
    '--management-status': statusColor,
    '--management-progress': `${usagePercent}%`,
  } as CSSProperties

  return (
    <motion.article
      animate={{ opacity: 1, x: 0 }}
      className={`${styles.managementListRow} ${styles.linkListRow}`}
      initial={{ opacity: 0, x: -10 }}
      style={rowStyle}
      transition={{ delay: index * 0.025, duration: 0.24 }}
    >
      <div className={styles.managementListIdentity}>
        <span aria-hidden="true"><Link2 /></span>
        <div>
          <h3>{link.name || `${t('users.card.link', 'Enlace')} ${link.token.substring(0, 6)}`}</h3>
          <p>{formatRole(link.role)}</p>
        </div>
      </div>
      <div className={styles.listUsage}>
        <span><Users aria-hidden="true" />{link.current_uses}/{link.max_uses}</span>
        <div className={styles.miniUsageTrack}><span /></div>
      </div>
      <div className={styles.managementListValue}>
        <CalendarDays aria-hidden="true" />
        <span>{formatDate(link.expires_at, i18n.language)}</span>
      </div>
      <span className={styles.managementStatus}>{t(`users.card.${link.status}`, link.status)}</span>
      <div className={styles.listActions}>
        <button aria-label={link.status === 'active' ? t('users.card.suspend', 'Pausar') : t('users.card.activate', 'Activar')} className={styles.iconAction} onClick={onToggleStatus} type="button">
          {link.status === 'active' ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <button aria-label={t('users.card.delete', 'Eliminar')} className={`${styles.iconAction} ${styles.dangerAction}`} onClick={onDelete} type="button">
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  )
}

function formatRole(role: string) {
  return ({ owner: 'Propietario', admin: 'Administrador', member: 'Miembro' } as Record<string, string>)[role] ?? role
}

export { InviteLinkRow }
export type { InviteLinkRowProps }
