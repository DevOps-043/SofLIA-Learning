'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  BarChart3,
  Building2,
  CircleAlert,
  CircleOff,
  Crown,
  Mail,
  MapPin,
  Network,
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

interface UserListRowProps {
  user: BusinessUser
  index: number
  onEdit: () => void
  onDelete: () => void
  onStats: () => void
  onResend?: () => void
}

function UserListRow({ user, index, onEdit, onDelete, onStats, onResend }: UserListRowProps) {
  const { t, i18n } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const displayName =
    user.display_name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username
  const roleConfig = getRoleConfig(user.org_role || 'member', theme, t)
  const statusConfig = getStatusConfig(user.org_status || 'active', theme, t)
  const StatusIcon = statusConfig.icon
  const statusStyle = { '--status-color': statusConfig.color } as CSSProperties
  const hierarchy = [
    { value: user.region_name, icon: MapPin },
    { value: user.zone_name, icon: Building2 },
    { value: user.team_name, icon: Network },
  ].filter((item) => item.value)

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.14), duration: 0.22 }}
      className={styles.listRow}
      style={statusStyle}
    >
      <div className={styles.listIdentity}>
        <div className={styles.listAvatar}>
          {user.profile_picture_url ? (
            <Image src={user.profile_picture_url} alt="" width={48} height={48} />
          ) : (
            <span aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className={styles.identity}>
          <p className={styles.listName}>
            {displayName}
            {user.org_role === 'owner' ? <Crown aria-label={roleConfig.label} /> : null}
          </p>
          <p className={styles.listEmail}>{user.email}</p>
        </div>
      </div>

      <div className={styles.listHierarchy}>
        {hierarchy.length > 0 ? (
          hierarchy.map(({ value, icon: Icon }) => (
            <span key={value}>
              <Icon aria-hidden="true" />
              {value}
            </span>
          ))
        ) : (
          <span aria-label={t('users.card.noHierarchy', 'Sin jerarquía')}>—</span>
        )}
      </div>

      <div className={styles.listBadges}>
        <span
          className={styles.roleBadge}
          style={{ backgroundColor: roleConfig.bg, color: roleConfig.text }}
        >
          {roleConfig.label}
        </span>
        <span className={styles.statusBadge}>
          <StatusIcon aria-hidden="true" />
          <span>{statusConfig.label}</span>
        </span>
      </div>

      <p className={styles.listMuted}>
        {user.last_activity_at || user.last_login_at
          ? formatDate(
              (user.last_activity_at ?? user.last_login_at) as string,
              i18n.language,
              { day: '2-digit', month: 'short' },
            )
          : '—'}
      </p>

      <div className={styles.listActions}>
        {user.org_status === 'invited' && onResend ? (
          <button
            type="button"
            onClick={onResend}
            className={styles.iconAction}
            title={t('users.card.resendInvite')}
            aria-label={t('users.card.resendInvite')}
          >
            <Send aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onStats}
          className={styles.iconAction}
          title={t('users.card.viewStats')}
          aria-label={t('users.card.viewStats')}
        >
          <BarChart3 aria-hidden="true" />
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
        <button
          type="button"
          onClick={onDelete}
          className={`${styles.iconAction} ${styles.dangerAction}`}
          title={t('users.card.delete')}
          aria-label={t('users.card.delete')}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
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

export { UserListRow }
export type { UserListRowProps }
