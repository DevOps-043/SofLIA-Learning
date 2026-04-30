'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Edit,
  Trash,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  MapPin,
  Building2,
  Network,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { BusinessUser } from '@/features/business-panel/services/businessUsers.service'
import { formatDate } from '@/shared/utils/date-formatter'

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

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  const getRoleConfig = (role: string) => {
    const { roleColors } = theme
    switch (role) {
      case 'owner': return { label: t('users.roles.owner'), color: roleColors.owner.text, bg: roleColors.owner.bg }
      case 'admin': return { label: t('users.roles.admin'), color: roleColors.admin.text, bg: roleColors.admin.bg }
      default:      return { label: t('users.roles.member'), color: theme.successColor,   bg: `${theme.successColor}25` }
    }
  }

  const getStatusConfig = (status: string) => {
    const { statusColors } = theme
    switch (status) {
      case 'active':    return { label: t('users.status.active'),    color: statusColors.active,    icon: CheckCircle }
      case 'invited':   return { label: t('users.status.invited'),   color: statusColors.invited,   icon: Mail }
      case 'suspended': return { label: t('users.status.suspended'), color: statusColors.suspended, icon: XCircle }
      default:          return { label: t('users.status.removed'),   color: statusColors.removed,   icon: AlertCircle }
    }
  }

  const roleConfig = getRoleConfig(user.org_role || 'member')
  const statusConfig = getStatusConfig(user.org_status || 'active')
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
      style={{ backgroundColor: theme.cardBg }}
    >
      {/* Avatar */}
      {user.profile_picture_url ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={user.profile_picture_url} alt={displayName} width={40} height={40} className="object-cover w-full h-full" />
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: `${theme.primaryColor}30`, color: theme.isDark ? '#FFFFFF' : theme.primaryColor }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 items-center">
        {/* Name & Email */}
        <div className="min-w-0 col-span-1 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: theme.textColor }}>
              {displayName}
            </span>
            {user.org_role === 'owner' && <Crown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
          </div>
          <p className="text-xs opacity-50 truncate">{user.email}</p>
        </div>

        {/* Hierarchy */}
        <div className="hidden lg:flex items-center gap-1 text-xs opacity-60 min-w-0">
          {user.region_name && (
            <span className="truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {user.region_name}
            </span>
          )}
          {user.zone_name && (
            <span className="truncate flex items-center gap-1 ml-2">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              {user.zone_name}
            </span>
          )}
          {user.team_name && (
            <span className="truncate flex items-center gap-1 ml-2">
              <Network className="w-3 h-3 flex-shrink-0" />
              {user.team_name}
            </span>
          )}
          {!user.region_name && !user.zone_name && !user.team_name && (
            <span className="text-xs opacity-40">—</span>
          )}
        </div>

        {/* Role & Status */}
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: roleConfig.bg, color: roleConfig.color }}
          >
            {roleConfig.label}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
            style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
        </div>

        {/* Last Access */}
        <div className="hidden sm:block text-xs opacity-50 text-right">
          {user.last_login_at
            ? formatDate(user.last_login_at, i18n.language, { day: '2-digit', month: 'short' })
            : '—'}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {user.org_status === 'invited' && onResend && (
          <button
            onClick={(e) => { e.stopPropagation(); onResend() }}
            className={`p-1.5 rounded-lg transition-colors border border-amber-500/20 ${theme.isDark ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'bg-amber-500/5 hover:bg-amber-500/10'}`}
            title={t('users.card.resendInvite')}
          >
            <Mail className="w-4 h-4 text-amber-500" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            const tab = user.org_status === 'invited' ? 'invitations' : 'users'
            window.dispatchEvent(new CustomEvent('change-user-tab', { detail: tab }))
          }}
          className={`p-1.5 rounded-lg transition-colors ${theme.isDark ? 'hover:bg-emerald-500/20' : 'hover:bg-blue-500/10'}`}
          title={t('users.card.manage')}
        >
          <ChevronRight className={`w-4 h-4 ${theme.isDark ? 'text-emerald-400' : 'text-blue-400'}`} />
        </button>
        <button
          onClick={onStats}
          className={`p-1.5 rounded-lg transition-colors ${theme.isDark ? 'hover:bg-emerald-500/20' : 'hover:bg-blue-500/10'}`}
          title={t('users.card.viewStats')}
        >
          <BarChart3 className={`w-4 h-4 ${theme.isDark ? 'text-emerald-400' : 'text-blue-400'}`} />
        </button>
        <button
          onClick={onEdit}
          className={`p-1.5 rounded-lg transition-colors ${theme.isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
          title={t('users.card.edit')}
        >
          <Edit className="w-4 h-4 opacity-70" style={{ color: theme.textColor }} />
        </button>
        <button
          onClick={onDelete}
          className={`p-1.5 rounded-lg transition-colors ${theme.isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'}`}
          title={t('users.card.delete')}
        >
          <Trash className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </motion.div>
  )
}

export { UserListRow }
export type { UserListRowProps }
