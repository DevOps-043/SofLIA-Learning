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
  Sparkles,
  Crown,
  Activity,
  ChevronRight,
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
// COMPONENTE: UserCard Premium
// ============================================
interface UserCardProps {
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

function UserCard({ user, index, primaryColor, onEdit, onDelete, onStats, onResend, onSuspend, onActivate }: UserCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const [showActions, setShowActions] = useState(false)
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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{
        y: -6,
        scale: 1.01,
        transition: { duration: 0.25 }
      }}
      className="relative group overflow-hidden rounded-2xl"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Animated Border */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, transparent, ${primaryColor})`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />

      {/* Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-300" />

      {/* Glow Effect */}
      <motion.div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-700"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Content */}
      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {user.profile_picture_url ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10">
                  <Image
                    src={user.profile_picture_url}
                    alt={displayName}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold border-2 border-white/10"
                  style={{
                    backgroundColor: `${primaryColor}30`,
                    color: isDark ? '#FFFFFF' : primaryColor
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {user.org_role === 'owner' && (
                <div className="absolute -top-1 -right-1 p-1 rounded-full bg-purple-500">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{displayName}</h3>
              <p className="text-sm opacity-50 truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{user.email}</p>
            </div>
          </div>

          {/* Actions Menu */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 flex-shrink-0"
              >
                <button
                  onClick={onStats}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-blue-500/20' : 'bg-black/5 hover:bg-blue-500/10'}`}
                  title="Ver estadísticas"
                >
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={onEdit}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                  title="Editar"
                >
                  <Edit className="w-4 h-4" style={{ color: isDark ? '#FFFFFF' : '#0F172A', opacity: 0.7 }} />
                </button>
                <button
                  onClick={onDelete}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 hover:bg-red-500/20' : 'bg-black/5 hover:bg-red-500/10'}`}
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4 text-red-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: roleConfig.bg, color: roleConfig.color }}
          >
            {roleConfig.label}
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-white/5">
          <div className="text-xs opacity-50 flex-1 min-w-0">
            {user.last_login_at ? (
              <span>{t('users.card.lastAccess')}: {new Date(user.last_login_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
            ) : (
              <span>{t('users.card.noAccess')}</span>
            )}
          </div>

          {/* Quick Actions Based on Status */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
            {user.org_status === 'invited' && onResend && (
              <button
                onClick={(e) => { e.stopPropagation(); onResend?.() }}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors border border-amber-500/20 flex items-center gap-1.5 font-bold"
              >
                <Mail className="w-3.5 h-3.5" />
                Reenviar
              </button>
            )}
            {user.org_status === 'active' && onSuspend && (
              <button
                onClick={onSuspend}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap"
              >
                {t('users.card.suspend')}
              </button>
            )}
            {user.org_status === 'suspended' && onActivate && (
              <button
                onClick={onActivate}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
              >
                {t('users.card.activate')}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const tab = user.org_status === 'invited' ? 'invitations' : 'users';
                // Encontrar el contenedor o disparar un evento si es necesario,
                // pero por ahora simplemente cambiaremos la pestaña si estamos en el mismo componente
                window.dispatchEvent(new CustomEvent('change-user-tab', { detail: tab }));
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20 font-bold"
            >
              Gestionar
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Progress Line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }}
        initial={{ width: 0 }}
        animate={{ width: '40%' }}
        transition={{ delay: index * 0.05 + 0.3, duration: 0.6 }}
      />
    </motion.div>
  )
}

export { UserCard }
export type { UserCardProps }
