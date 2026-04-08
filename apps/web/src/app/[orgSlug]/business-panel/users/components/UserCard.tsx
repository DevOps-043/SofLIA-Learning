'use client'

import { useState } from 'react'
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
  Activity,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { BusinessUser } from '@/features/business-panel/services/businessUsers.service'

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
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const [showOptions, setShowOptions] = useState(false)

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  const getRoleConfig = (role: string) => {
    const { roleColors } = theme
    switch (role) {
      case 'owner': return { label: t('users.roles.owner'), ...roleColors.owner }
      case 'admin': return { label: t('users.roles.admin'), ...roleColors.admin }
      default: return { label: t('users.roles.member'), ...roleColors.member }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onMouseLeave={() => setShowOptions(false)}
      className="group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        backdropFilter: 'blur(20px)',
        boxShadow: theme.isDark
          ? '0 20px 40px -20px rgba(0,0,0,0.5)'
          : '0 10px 20px -10px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header Hero Section */}
      <div className="relative h-32 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 transform scale-150 rotate-12 blur-[50px]"
          style={{ background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)` }}
        />

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 transition-transform duration-500 group-hover:scale-105"
              style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            >
              {user.profile_picture_url ? (
                <Image
                  src={user.profile_picture_url}
                  alt={displayName}
                  width={100}
                  height={100}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-black"
                  style={{ backgroundColor: theme.inputBg, color: theme.accentColor }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div
              className="absolute -bottom-1 -right-1 p-1 rounded-full border-2 shadow-lg"
              style={{
                backgroundColor: statusConfig.color,
                borderColor: theme.isDark ? '#1e2329' : '#fff',
              }}
            >
              <statusConfig.icon className="w-3 h-3 text-black" />
            </div>

            {/* Owner Crown */}
            {user.org_role === 'owner' && (
              <div className="absolute -top-3 -left-3 p-1.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl border border-white/20">
                <Crown className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4 pt-0">
        <div className="text-center mb-4">
          <h3 className="font-bold text-lg tracking-tight truncate mb-0.5" style={{ color: theme.textColor }}>
            {displayName}
          </h3>
          <p className="text-[11px] truncate opacity-50 font-medium" style={{ color: theme.subtextColor }}>
            {user.email}
          </p>
        </div>

        {/* Meta Row */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5">
            <span className="text-[9px] font-black uppercase tracking-tight opacity-40">Rol Organizo</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: roleConfig.bg, color: roleConfig.text }}
            >
              {roleConfig.label}
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5">
            <span className="text-[9px] font-black uppercase tracking-tight opacity-40">Última vez</span>
            <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: theme.textColor }}>
              <Calendar className="w-3 h-3 opacity-40" />
              {user.last_login_at
                ? new Date(user.last_login_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                : t('users.card.noAccess')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-wider border border-white/10"
              style={{ color: theme.textColor }}
            >
              <Edit className="w-4 h-4 opacity-70" />
              {t('users.buttons.edit', 'Editar')}
            </button>

            {user.org_status === 'active' && onSuspend ? (
              <button
                onClick={onSuspend}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all font-bold text-[10px] uppercase tracking-wider border border-red-500/20 text-red-400"
              >
                <Lock className="w-4 h-4" />
                {t('users.buttons.suspend', 'Suspender')}
              </button>
            ) : user.org_status === 'suspended' && onActivate ? (
              <button
                onClick={onActivate}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20 text-emerald-400"
              >
                <Unlock className="w-4 h-4" />
                {t('users.buttons.activate', 'Activar')}
              </button>
            ) : (
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all font-bold text-[10px] uppercase tracking-wider border border-red-500/20 text-red-500"
              >
                <Trash className="w-4 h-4" />
                {t('users.buttons.delete', 'Eliminar')}
              </button>
            )}
          </div>

          {/* Manage CTA */}
          <button
            onClick={onStats}
            className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 group/managed"
            style={{
              backgroundColor: theme.accentColor,
              color: theme.isDark ? '#000000' : '#FFFFFF',
            }}
          >
            <Activity className="w-4 h-4 group-hover/managed:animate-pulse" />
            <span>{t('users.card.manage', 'Gestionar')}</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export { UserCard }
export type { UserCardProps }
