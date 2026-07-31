'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Link2, Pause, Play, Shield, Trash2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

import styles from './UsersPanel.module.css'

interface InviteLinkCardProps {
  link: BulkInviteLink
  index: number
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkCard({ link, index, onToggleStatus, onDelete }: InviteLinkCardProps) {
  const { t, i18n } = useTranslation('business')
  const status = getLinkStatus(link.status, {
    active: t('users.card.active', 'Activo'),
    exhausted: t('users.card.exhausted', 'Agotado'),
    expired: t('users.card.expired', 'Vencido'),
    paused: t('users.card.paused', 'Pausado'),
  })
  const usagePercent = Math.min(100, (link.current_uses / Math.max(link.max_uses, 1)) * 100)
  const cardStyle = {
    '--management-status': status.color,
    '--management-progress': `${usagePercent}%`,
  } as CSSProperties

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={styles.managementCard}
      initial={{ opacity: 0, y: 16 }}
      style={cardStyle}
      transition={{ delay: index * 0.035, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className={styles.managementCardHeader}>
        <span className={styles.managementIcon} aria-hidden="true"><Link2 /></span>
        <div className={styles.managementIdentity}>
          <p className={styles.managementEyebrow}>{t('users.list.link', 'Enlace de acceso')}</p>
          <h3 className={styles.managementTitle} title={link.name ?? undefined}>
            {link.name || `${t('users.card.link', 'Enlace')} ${link.token.substring(0, 6)}`}
          </h3>
        </div>
        <span className={styles.managementStatus}>{status.icon}{status.label}</span>
      </header>

      <div className={styles.managementDivider} />

      <div className={styles.usageBlock}>
        <div className={styles.usageHeader}>
          <span><Users aria-hidden="true" />{t('users.card.uses', 'Usos')}</span>
          <strong>{link.current_uses} / {link.max_uses}</strong>
        </div>
        <div className={styles.usageTrack} aria-label={`${usagePercent.toFixed(0)}%`} role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}>
          <motion.span animate={{ width: `${usagePercent}%` }} initial={{ width: 0 }} />
        </div>
      </div>

      <dl className={`${styles.managementMeta} ${styles.managementMetaCompact}`}>
        <div className={styles.managementMetaItem}>
          <Shield aria-hidden="true" />
          <dt>{t('users.modals.delete.fields.role', 'Rol')}</dt>
          <dd>{formatRole(link.role)}</dd>
        </div>
        <div className={styles.managementMetaItem}>
          <CalendarDays aria-hidden="true" />
          <dt>{t('users.card.expires', 'Vence')}</dt>
          <dd>{formatDate(link.expires_at, i18n.language)}</dd>
        </div>
      </dl>

      <footer className={styles.managementActions}>
        <button className={styles.cardPrimaryAction} onClick={onToggleStatus} type="button">
          {link.status === 'active' ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {link.status === 'active' ? t('users.card.suspend', 'Pausar') : t('users.card.activate', 'Activar')}
        </button>
        <button aria-label={t('users.card.delete', 'Eliminar enlace')} className={`${styles.iconAction} ${styles.dangerAction}`} onClick={onDelete} title={t('users.card.delete', 'Eliminar enlace')} type="button">
          <Trash2 aria-hidden="true" />
        </button>
      </footer>
    </motion.article>
  )
}

function getLinkStatus(status: string, labels: Record<string, string>) {
  if (status === 'active') return { label: labels.active, color: 'var(--users-success)', icon: <Link2 aria-hidden="true" /> }
  if (status === 'paused') return { label: labels.paused, color: 'var(--users-warning)', icon: <Pause aria-hidden="true" /> }
  if (status === 'expired') return { label: labels.expired, color: 'var(--users-danger)', icon: <CalendarDays aria-hidden="true" /> }
  return { label: labels.exhausted, color: 'var(--users-muted)', icon: <Users aria-hidden="true" /> }
}

function formatRole(role: string) {
  return ({ owner: 'Propietario', admin: 'Administrador', member: 'Miembro' } as Record<string, string>)[role] ?? role
}

export { InviteLinkCard }
export type { InviteLinkCardProps }
