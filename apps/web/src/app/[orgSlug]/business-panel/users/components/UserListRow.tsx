'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Shield,
  Edit,
  Trash,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Activity,
  Eye,
  MapPin,
  Building2,
  Network,
  Pause,
  Play,
  Trash2,
  BarChart3
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { BusinessUser } from '@/features/business-panel/services/businessUsers.service'

// ============================================
// COMPONENTE: UserListRow (Vista compacta)
// ============================================
interface UserListRowProps {
  user: BusinessUser
  index: number
  primaryColor: string
  onEdit: () => void
  onDelete: () => void
  onStats: () => void
  onResend?: () => void
  onSuspend?: () => void
  onActivate?: () => void
}

function UserListRow({ user, index, primaryColor, onEdit, onDelete, onStats, onResend, onSuspend, onActivate }: UserListRowProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'owner': return { label: t('users.roles.owner'), color: '#A855F7', bg: 'rgba(168,85,247,0.15)' }
      case 'admin': return { label: t('users.roles.admin'), color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' }
      default: return { label: t('users.roles.member'), color: '#10B981', bg: 'rgba(16,185,129,0.15)' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: t('users.status.active'), color: '#10B981', icon: CheckCircle }
      case 'invited': return { label: t('users.status.invited'), color: '#F59E0B', icon: Mail }
      case 'suspended': return { label: t('users.status.suspended'), color: '#EF4444', icon: XCircle }
      default: return { label: t('users.status.removed'), color: '#6B7280', icon: AlertCircle }
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
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      {/* Avatar */}
      {user.profile_picture_url ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={user.profile_picture_url} alt={displayName} width={40} height={40} className="object-cover w-full h-full" />
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: `${primaryColor}30`, color: isDark ? '#FFFFFF' : primaryColor }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 items-center">
        {/* Name & Email */}
        <div className="min-w-0 col-span-1 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{displayName}</span>
            {user.org_role === 'owner' && <Crown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
          </div>
          <p className="text-xs opacity-50 truncate">{user.email}</p>
        </div>

        {/* Hierarchy Info */}
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
          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
        </div>
      </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {user.org_status === 'invited' && onResend && (
            <button
              onClick={(e) => { e.stopPropagation(); onResend() }}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'bg-amber-500/5 hover:bg-amber-500/10'} border border-amber-500/20`}
              title="Reenviar Invitación"
            >
              <Mail className="w-4 h-4 text-amber-500" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const tab = user.org_status === 'invited' ? 'invitations' : 'users';
              window.dispatchEvent(new CustomEvent('change-user-tab', { detail: tab }));
            }}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-500/10'}`}
            title="Gestionar"
          >
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </button>
          <button onClick={onStats} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-500/10'}`} title="Ver estadísticas">
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </button>
          <button onClick={onEdit} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`} title="Editar">
            <Edit className="w-4 h-4 opacity-70" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }} />
          </button>
          <button onClick={onDelete} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'}`} title="Eliminar">
            <Trash className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </motion.div>
    )
  }


export { UserListRow }
export type { UserListRowProps }
