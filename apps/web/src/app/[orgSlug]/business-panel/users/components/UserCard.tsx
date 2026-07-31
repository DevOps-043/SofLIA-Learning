'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  CalendarDays,
  ChartNoAxesCombined,
  CircleAlert,
  CircleOff,
  Crown,
  LockKeyhole,
  LockKeyholeOpen,
  Mail,
  PencilLine,
  Send,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import type { BusinessUser } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

import styles from './UsersPanel.module.css'

interface UserCardProps {
  user: BusinessUser
  index: number
  onEdit: () => void
  onDelete: () => void
  onStats: () => void
  onResend?: () => void
  onSuspend?: () => void
  onActivate?: () => void
}

function UserCard({ user, index, onEdit, onDelete, onStats, onResend, onSuspend, onActivate }: UserCardProps) {
  const { t, i18n } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const displayName =
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username

  const roleConfig = getRoleConfig(user.org_role || 'member', theme, t)
  const statusConfig = getStatusConfig(user.org_status || 'active', theme, t)
  const StatusIcon = statusConfig.icon
  const lastAccess =
    user.last_activity_at || user.last_login_at
      ? formatDate(
          (user.last_activity_at ?? user.last_login_at) as string,
          i18n.language,
          { day: '2-digit', month: 'short' },
        )
      : t('users.card.noAccess')
  const cardStyle = {
    '--status-color': statusConfig.color,
  } as CSSProperties

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.16), duration: 0.28, ease: 'easeOut' }}
      className={styles.userCard}
      style={cardStyle}
    >
      <header className={styles.userCardHeader}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {user.profile_picture_url ? (
              <Image
                src={user.profile_picture_url}
                alt=""
                width={72}
                height={72}
              />
            ) : (
              <span aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className={styles.presence} title={statusConfig.label}>
            <StatusIcon aria-hidden="true" />
          </span>
          {user.org_role === 'owner' ? (
            <span className={styles.ownerMark} title={roleConfig.label}>
              <Crown aria-hidden="true" />
            </span>
          ) : null}
        </div>

        <div className={styles.identity}>
          <h2 className={styles.userName}>{displayName}</h2>
          <p className={styles.userEmail}>{user.email}</p>
        </div>

        <span className={styles.statusBadge}>
          <StatusIcon aria-hidden="true" />
          <span>{statusConfig.label}</span>
        </span>
      </header>

      <div className={styles.cardDivider} />

      <div className={styles.metaList}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t('users.card.organizationRole')}</span>
          <span
            className={styles.roleBadge}
            style={{ backgroundColor: roleConfig.bg, color: roleConfig.text }}
          >
            {roleConfig.label}
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>{t('users.card.lastTime')}</span>
          <span className={styles.metaValue}>
            <CalendarDays aria-hidden="true" />
            {lastAccess}
          </span>
        </div>
      </div>

      <footer className={styles.cardActions}>
        <button type="button" onClick={onStats} className={styles.cardPrimaryAction}>
          <ChartNoAxesCombined aria-hidden="true" />
          <span>{t('users.card.statistics')}</span>
        </button>

        <button
          type="button"
          onClick={onEdit}
          className={styles.iconAction}
          title={t('users.card.edit')}
          aria-label={t('users.card.edit')}
        >
          <PencilLine aria-hidden="true" />
        </button>

        {user.org_status === 'active' && onSuspend ? (
          <button
            type="button"
            onClick={onSuspend}
            className={`${styles.iconAction} ${styles.dangerAction}`}
            title={t('users.card.suspend')}
            aria-label={t('users.card.suspend')}
          >
            <LockKeyhole aria-hidden="true" />
          </button>
        ) : user.org_status === 'suspended' && onActivate ? (
          <button
            type="button"
            onClick={onActivate}
            className={`${styles.iconAction} ${styles.successAction}`}
            title={t('users.card.activate')}
            aria-label={t('users.card.activate')}
          >
            <LockKeyholeOpen aria-hidden="true" />
          </button>
        ) : user.org_status === 'invited' && onResend ? (
          <button
            type="button"
            onClick={onResend}
            className={styles.iconAction}
            title={t('users.card.resendInvite')}
            aria-label={t('users.card.resendInvite')}
          >
            <Send aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onDelete}
            className={`${styles.iconAction} ${styles.dangerAction}`}
            title={t('users.card.delete')}
            aria-label={t('users.card.delete')}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </footer>
    </motion.article>
  )
}

function getRoleConfig(
  role: string,
  theme: ReturnType<typeof useBusinessPanelTheme>,
  t: ReturnType<typeof useTranslation>['t'],
) {
  switch (role) {
    case 'owner':
      return { label: t('users.roles.owner'), ...theme.roleColors.owner }
    case 'admin':
      return { label: t('users.roles.admin'), ...theme.roleColors.admin }
    default:
      return { label: t('users.roles.member'), ...theme.roleColors.member }
  }
}

function getStatusConfig(
  status: string,
  theme: ReturnType<typeof useBusinessPanelTheme>,
  t: ReturnType<typeof useTranslation>['t'],
) {
  switch (status) {
    case 'active':
      return { label: t('users.status.active'), color: theme.statusColors.active, icon: BadgeCheck }
    case 'invited':
      return { label: t('users.status.invited'), color: theme.statusColors.invited, icon: Mail }
    case 'suspended':
      return { label: t('users.status.suspended'), color: theme.statusColors.suspended, icon: CircleOff }
    default:
      return { label: t('users.status.removed'), color: theme.statusColors.removed, icon: CircleAlert }
  }
}

export { UserCard }
export type { UserCardProps }
