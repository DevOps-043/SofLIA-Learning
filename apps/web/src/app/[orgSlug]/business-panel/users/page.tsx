'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Edit,
  Trash,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  BarChart3,
  Sparkles,
  UserPlus,
  Crown,
  Activity,
  ChevronRight,
  MoreHorizontal,
  Eye,
  LayoutGrid,
  List,
  MapPin,
  Building2,
  Network,
  Filter,
  X,
  Link2,
  Pause,
  Play,
  Trash2,
  Calendar,
  Clock
} from 'lucide-react'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { useBusinessUsers } from '@/features/business-panel/hooks/useBusinessUsers'
import { BusinessUsersService, BusinessUser, BusinessInvitation, BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ToastNotification, ToastType } from '@/core/components/ToastNotification/ToastNotification'

const AddUserModal = dynamic(() => import('@/features/business-panel/components/BusinessAddUserModal').then(mod => ({ default: mod.BusinessAddUserModal })), { ssr: false })
const EditUserModal = dynamic(() => import('@/features/business-panel/components/BusinessEditUserModal').then(mod => ({ default: mod.BusinessEditUserModal })), { ssr: false })
const DeleteUserModal = dynamic(() => import('@/features/business-panel/components/BusinessDeleteUserModal').then(mod => ({ default: mod.BusinessDeleteUserModal })), { ssr: false })
const ImportUsersModal = dynamic(() => import('@/features/business-panel/components/BusinessImportUsersModal').then(mod => ({ default: mod.BusinessImportUsersModal })), { ssr: false })
const UserStatsModal = dynamic(() => import('@/features/business-panel/components/BusinessUserStatsModal').then((mod) => ({ default: mod.BusinessUserStatsModal })), { ssr: false })
const UnifiedInviteModal = dynamic(() => import('@/features/business-panel/components/BusinessUnifiedInviteModal').then(mod => ({ default: mod.BusinessUnifiedInviteModal })), { ssr: false })

// ============================================
// COMPONENTE: StatCard Premium
// ============================================
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  delay: number
  trend?: number
  isDark?: boolean
  onClick?: () => void
}

function StatCard({ title, value, icon, gradient, delay, trend = 0, isDark, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      onClick={onClick}
      transition={{
        delay: delay * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 14
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, type: "spring", stiffness: 300 }
      }}
      className="relative group overflow-hidden rounded-2xl cursor-pointer"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      {/* Animated Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: gradient,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />

      {/* Glassmorphism Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-500" />

      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: gradient }}
      />

      {/* Soft Glow */}
      <motion.div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-700"
        style={{ background: gradient }}
      />

      {/* Content */}
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between mb-4">
          {/* Icon Container */}
          <motion.div
            className="p-3 rounded-xl backdrop-blur-md border border-white/10"
            style={{ background: `${gradient.split(',')[0].replace('linear-gradient(135deg, ', '')}20` }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {icon}
          </motion.div>

          {/* Trend Badge */}
          {trend !== 0 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay * 0.1 + 0.3, type: "spring" }}
            >
              <ArrowTrendingUpIcon className="h-3 w-3" />
              +{trend}%
            </motion.div>
          )}
        </div>

        <motion.h3
          className="text-3xl font-black tracking-tight mb-1"
          style={{
            color: isDark ? '#FFFFFF' : '#0F172A',
            textShadow: isDark ? '0 0 20px rgba(0,212,179,0.2)' : 'none'
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value.toLocaleString()}
        </motion.h3>

        <motion.p
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: isDark ? '#E5E7EB' : '#64748B', letterSpacing: '0.05em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDark ? 0.9 : 0.7 }}
          transition={{ delay: delay * 0.1 + 0.3 }}
        >
          {title}
        </motion.p>

        {/* Animated Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <motion.div
            className="h-full rounded-r-full"
            style={{ background: gradient }}
            initial={{ width: 0 }}
            animate={{ width: '50%' }}
            transition={{ delay: delay * 0.1 + 0.5, duration: 0.8 }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

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

// ============================================
// COMPONENTE: InvitationCard
// ============================================
interface InvitationCardProps {
  invitation: BusinessInvitation
  index: number
  primaryColor: string
  onResend: () => void
  onRevoke: () => void
}

function InvitationCard({ invitation, index, primaryColor, onResend, onRevoke }: InvitationCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl p-6 border border-white/10"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
            <Mail className="w-6 h-6 opacity-60" style={{ color: primaryColor }} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{invitation.email}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-white/5 text-white/40 border border-white/5">
                {invitation.role}
              </span>
              <span className="text-[10px] text-white/40 flex items-center gap-1 whitespace-nowrap">
                <Activity className="w-3 h-3" />
                {new Date(invitation.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onResend}
            className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-500 transition-colors"
            title="Reenviar"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={onRevoke}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-500 transition-colors"
            title="Revocar"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="text-[10px] uppercase font-bold tracking-wider opacity-30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {t('users.status.pending', 'Pendiente')}
        </div>
        <div className="text-[10px] opacity-40">
          Expira: {new Date(invitation.expires_at).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: InvitationListRow
// ============================================
interface InvitationListRowProps {
  invitation: BusinessInvitation
  index: number
  primaryColor: string
  onResend: () => void
  onRevoke: () => void
}

function InvitationListRow({ invitation, index, primaryColor, onResend, onRevoke }: InvitationListRowProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
        <Mail className="w-5 h-5 opacity-60" style={{ color: primaryColor }} />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="col-span-1 lg:col-span-2 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{invitation.email}</div>
          <div className="text-xs opacity-40 uppercase font-bold tracking-wider">{invitation.role}</div>
        </div>

        <div className="hidden lg:block text-xs opacity-60">
          Enviada: {new Date(invitation.created_at).toLocaleDateString()}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/10">
            {t('users.status.pending', 'Pendiente')}
          </span>
          <span className="text-[10px] opacity-40 whitespace-nowrap">
            Expira: {new Date(invitation.expires_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onResend}
          className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-500 transition-colors"
          title="Reenviar"
        >
          <Mail className="w-4 h-4" />
        </button>
        <button
          onClick={onRevoke}
          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-500 transition-colors"
          title="Revocar"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: Empty State Premium
// ============================================
function EmptyState({ onAddClick, primaryColor, secondaryColor }: { onAddClick: () => void, primaryColor: string, secondaryColor: string }) {
  const { t } = useTranslation('business')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-12 text-center"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryColor} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Particles */}
      <motion.div
        className="absolute top-10 left-20 w-3 h-3 rounded-full"
        style={{ backgroundColor: primaryColor }}
        animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-32 w-2 h-2 rounded-full"
        style={{ backgroundColor: secondaryColor }}
        animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <UserPlus className="w-12 h-12" style={{ color: primaryColor, opacity: 0.6 }} />
        </motion.div>

        <h3 className="text-2xl font-bold mb-3" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
          {t('users.empty.title')}
        </h3>

        <p className="text-sm opacity-60 mb-6 max-w-md mx-auto leading-relaxed" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
          {t('users.empty.subtitle')}
        </p>

        <motion.button
          onClick={onAddClick}
          className="px-6 py-3 rounded-xl font-bold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 8px 30px ${primaryColor}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {t('users.empty.cta')}
        </motion.button>
      </div>
    </motion.div>
  )
}
// ============================================
// COMPONENTE: InviteLinkCard
// ============================================
interface InviteLinkCardProps {
  link: BulkInviteLink
  index: number
  primaryColor: string
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkCard({ link, index, primaryColor, onToggleStatus, onDelete }: InviteLinkCardProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { text: '#10B981', bg: 'rgba(16,185,129,0.1)' }
      case 'paused': return { text: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
      case 'expired': return { text: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
      case 'exhausted': return { text: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
      default: return { text: primaryColor, bg: `${primaryColor}10` }
    }
  }

  const statusColors = getStatusColor(link.status)
  const remainingSlots = link.max_uses - link.current_uses

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative overflow-hidden rounded-2xl p-6 border border-white/10"
      style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
            <Link2 className="w-6 h-6 opacity-60" style={{ color: primaryColor }} />
          </div>
          <div>
            <h4 className="font-bold truncate max-w-[180px]" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
              {link.name || `Link ${link.token.substring(0, 6)}`}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold" style={{ backgroundColor: statusColors.bg, color: statusColors.text }}>
                {link.status}
              </span>
              <span className="text-[10px] opacity-40 uppercase font-bold">{link.role}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleStatus}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'}`}
            title={link.status === 'active' ? 'Pausar' : 'Activar'}
          >
            {link.status === 'active' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
          </button>
          <button
            onClick={onDelete}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'} hover:bg-red-500/20 group`}
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-40 mb-1">Usos</p>
          <p className="text-xl font-black" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {link.current_uses} <span className="text-sm font-normal opacity-40">/ {link.max_uses}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-40 mb-1">Espacios libres</p>
          <p className="text-xl font-black" style={{ color: remainingSlots > 0 ? primaryColor : '#EF4444' }}>
            {remainingSlots}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] opacity-30">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(link.created_at).toLocaleDateString()}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expira: {new Date(link.expires_at).toLocaleDateString()}</span>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: InviteLinkRow
// ============================================
interface InviteLinkRowProps {
  link: BulkInviteLink
  index: number
  primaryColor: string
  onToggleStatus: () => void
  onDelete: () => void
}

function InviteLinkRow({ link, index, primaryColor, onToggleStatus, onDelete }: InviteLinkRowProps) {
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const remainingSlots = link.max_uses - link.current_uses

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
        <Link2 className="w-5 h-5 opacity-60" style={{ color: primaryColor }} />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="col-span-1 lg:col-span-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {link.name || `Link ${link.token.substring(0, 6)}`}
          </div>
          <div className="text-[10px] opacity-40 uppercase font-bold tracking-wider">{link.role}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] opacity-40 uppercase mb-0.5">Usos</p>
            <p className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>{link.current_uses}/{link.max_uses}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] opacity-40 uppercase mb-0.5">Libres</p>
            <p className="text-sm font-bold" style={{ color: remainingSlots > 0 ? primaryColor : '#EF4444' }}>{remainingSlots}</p>
          </div>
        </div>

        <div className="hidden lg:block text-[10px] opacity-40">
          Expira: {new Date(link.expires_at).toLocaleDateString()}
        </div>

        <div className="flex items-center justify-end gap-2">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
            link.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
            link.status === 'paused' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {link.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onToggleStatus}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'}`}
        >
          {link.status === 'active' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
        </button>
        <button
          onClick={onDelete}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'} hover:bg-red-500/20`}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </motion.div>
  )
}

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

// ============================================
// PÁGINA PRINCIPAL: Users Management
// ============================================
export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as 'users' | 'invitations' | 'links'
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { 
    users, 
    invitations, 
    inviteLinks, 
    stats, 
    orgData, 
    isLoading, 
    error, 
    syncOrgData: refetch, 
    createUser, 
    updateUser, 
    deleteUser: originalDeleteUser, 
    resendInvitation: originalResendInvitation, 
    suspendUser: originalSuspendUser, 
    activateUser: originalActivateUser, 
    updateInviteLinkStatus: originalUpdateInviteLinkStatus, 
    deleteInviteLink: originalDeleteInviteLink 
  } = useBusinessUsers(orgSlug)
  const { user: currentUser } = useAuth()

  // Toast state
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'success'
  })

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  // Wrapped actions with notifications
  const resendInvitation = async (id: string) => {
    try {
      const result = await originalResendInvitation(id)
      if (result.success) {
        showToast('Invitación reenviada con éxito', 'success')
      } else {
        showToast(result.error || 'Error al reenviar invitación', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al reenviar invitación', 'error')
    }
  }

  const suspendUser = async (id: string) => {
    try {
      const result = await originalSuspendUser(id)
      if (result.success) {
        showToast('Usuario suspendido', 'success')
      } else {
        showToast(result.error || 'Error al suspender usuario', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al suspender usuario', 'error')
    }
  }

  const activateUser = async (id: string) => {
    try {
      const result = await originalActivateUser(id)
      if (result.success) {
        showToast('Usuario activado', 'success')
      } else {
        showToast(result.error || 'Error al activar usuario', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al activar usuario', 'error')
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const result = await originalDeleteUser(id)
      if (result.success) {
        showToast('Usuario eliminado con éxito', 'success')
        setIsDeleteModalOpen(false)
        setDeletingUser(null)
      } else {
        showToast(result.error || 'Error al eliminar usuario', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al eliminar usuario', 'error')
    }
  }

  const updateInviteLinkStatus = async (id: string, action: 'pause' | 'resume') => {
    try {
      const result = await originalUpdateInviteLinkStatus(id, action)
      if (result.success) {
        showToast(action === 'pause' ? 'Enlace pausado' : 'Enlace reactivado', 'success')
      } else {
        showToast(result.error || 'Error al actualizar enlace', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al actualizar enlace', 'error')
    }
  }

  const deleteInviteLink = async (id: string) => {
    try {
      const result = await originalDeleteInviteLink(id)
      if (result.success) {
        showToast('Enlace eliminado', 'success')
      } else {
        showToast(result.error || 'Error al eliminar enlace', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al eliminar enlace', 'error')
    }
  }

  const handleResendIndividualInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/${orgSlug}/business/invitations/${id}/resend`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        showToast('Invitación reenviada con éxito', 'success')
        refetch()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Error al reenviar invitación', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al reenviar invitación', 'error')
    }
  }

  const handleRevokeInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/${orgSlug}/business/invitations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        showToast('Invitación revocada con éxito', 'success')
        refetch()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Error al revocar invitación', 'error')
      }
    } catch (err) {
      showToast('Error inesperado al revocar invitación', 'error')
    }
  }

  // View mode and Tabs state
  const [activeTab, setActiveTab] = useState<'users' | 'invitations' | 'links'>(initialTab || 'users')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  // Effect to sync tab from URL
  useEffect(() => {
    if (initialTab && ['users', 'invitations', 'links'].includes(initialTab)) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Effect to handle custom tab changes
  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail && ['users', 'invitations', 'links'].includes(e.detail)) {
        setActiveTab(e.detail)
        // Scroll to top if needed or just switch
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('change-user-tab', handleTabChange)
    return () => window.removeEventListener('change-user-tab', handleTabChange)
  }, [])
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterZone, setFilterZone] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Dropdown states
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false)
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false)
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
  
  // Modal states
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<BusinessUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [statsUser, setStatsUser] = useState<BusinessUser | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isUnifiedInviteModalOpen, setIsUnifiedInviteModalOpen] = useState(false)

  // Extract unique values for hierarchy filters
  const uniqueRegions = [...new Set(users.filter(u => u.region_name).map(u => u.region_name))]
  const uniqueZones = [...new Set(users.filter(u => u.zone_name).map(u => u.zone_name))]
  const uniqueTeams = [...new Set(users.filter(u => u.team_name).map(u => u.team_name))]
  
  // Count active filters
  const activeFiltersCount = [filterRole, filterStatus, filterRegion, filterZone, filterTeam].filter(f => f !== 'all').length


  const filteredUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.org_role === filterRole
    const matchesStatus = filterStatus === 'all' || user.org_status === filterStatus
    const matchesRegion = filterRegion === 'all' || user.region_name === filterRegion
    const matchesZone = filterZone === 'all' || user.zone_name === filterZone
    const matchesTeam = filterTeam === 'all' || user.team_name === filterTeam
    return matchesSearch && matchesRole && matchesStatus && matchesRegion && matchesZone && matchesTeam
  })

  const filteredInvitations = invitations.filter(inv => 
    inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Clear all filters helper
  const clearAllFilters = () => {
    setFilterRole('all')
    setFilterStatus('all')
    setFilterRegion('all')
    setFilterZone('all')
    setFilterTeam('all')
    setSearchTerm('')
  }

  // Theme Logic
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const themeColors = useMemo(() => ({
    text: isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A',
    secondaryText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
    cardBg: isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF',
    borderColor: isDark ? (panelStyles?.border_color || 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.1)',
    primary: panelStyles?.primary_button_color || '#0A2540',
    secondary: panelStyles?.secondary_button_color || '#1E2329',
    accent: panelStyles?.accent_color || '#00D4B3'
  }), [panelStyles, isDark])

  const { primary: primaryColor, secondary: secondaryColor, accent: accentColor } = themeColors

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6 min-h-screen animate-pulse">
        <div className="h-48 rounded-3xl bg-gray-800/50 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-2xl" />)}
        </div>
        <div className="h-12 bg-gray-800/50 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-800/50 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-8 group"
      >
        {/* Background Gradient */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            opacity: isDark ? 0.3 : 1
          }}
        />

        {/* Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        {/* Animated Particles */}
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-10 right-20 w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-10 right-40 w-3 h-3 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                </motion.div>
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
                  {t('sidebar.users')}
                </span>
              </div>

                <motion.h1
                  className="text-3xl lg:text-4xl font-bold mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                >
                  {t('users.title')}
                </motion.h1>

                <motion.p
                  className="text-lg max-w-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)' }}
                >
                  {t('users.subtitle')}
                </motion.p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onClick={async () => {
                  const response = await fetch('/api/business/users/template', { credentials: 'include' })
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'plantilla-importacion-usuarios.csv'
                    a.click()
                  }
                }}

                className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors flex items-center gap-2"
                style={{ 
                  color: isDark ? '#FFFFFF' : '#0F172A', 
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)'
                }}
                whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                {t('users.buttons.template')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors flex items-center gap-2"
                style={{ 
                  color: isDark ? '#FFFFFF' : '#0F172A', 
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)'
                }}
                whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="w-4 h-4" />
                {t('users.buttons.import', 'Importar')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => setIsUnifiedInviteModalOpen(true)}
                className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors flex items-center gap-2"
                style={{ 
                  color: isDark ? '#FFFFFF' : '#0F172A', 
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)'
                }}
                whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Mail className="w-4 h-4" />
                {t('users.buttons.invite', 'Invitar')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 }}
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm !text-white transition-all flex items-center gap-2"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                  boxShadow: `0 8px 30px ${primaryColor}40`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5 !text-white" color="#FFFFFF" strokeWidth={3} />
                <span className="!text-white font-bold" style={{ color: '#FFFFFF' }}>
                  {t('users.buttons.add')}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-amber-400">{t('users.error.loadFailed')}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('users.stats.total')}
          value={stats.total}
          icon={<Users className="w-6 h-6" style={{ color: '#3B82F6' }} />}
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
          delay={0}
          trend={12}
          isDark={isDark}
        />
        <StatCard
          title={t('users.stats.active')}
          value={stats.active}
          icon={<CheckCircle className="w-6 h-6" style={{ color: '#10B981' }} />}
          gradient="linear-gradient(135deg, #10B981, #059669)"
          delay={1}
          trend={8}
          isDark={isDark}
        />
        <StatCard
          title={t('users.stats.invited')}
          value={stats.invited}
          icon={<Mail className="w-6 h-6" style={{ color: '#F59E0B' }} />}
          gradient="linear-gradient(135deg, #F59E0B, #D97706)"
          delay={2}
          isDark={isDark}
          onClick={() => setActiveTab('invitations')}
        />
        <StatCard
          title={t('users.stats.admins')}
          value={stats.admins}
          icon={<Shield className="w-6 h-6" style={{ color: '#A855F7' }} />}
          gradient="linear-gradient(135deg, #A855F7, #7C3AED)"
          delay={3}
          trend={5}
          isDark={isDark}
        />
      </div>

        {/* Tabs and Search Bar */}
        <div className="flex flex-col space-y-4">
          {/* Custom Tabs */}
          <div className="flex items-center p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
              style={{ 
                backgroundColor: activeTab === 'users' ? primaryColor : 'transparent',
                color: activeTab === 'users' ? '#FFFFFF' : undefined
              }}
            >
              {t('users.title', 'Usuarios')}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'users' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                {users.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'invitations' ? 'shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
              style={{ 
                backgroundColor: activeTab === 'invitations' ? primaryColor : 'transparent',
                color: activeTab === 'invitations' ? '#FFFFFF' : undefined
              }}
            >
              {t('users.tabs.invitations', 'Individuales')}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'invitations' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                {invitations.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'links' ? 'shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
              style={{ 
                backgroundColor: activeTab === 'links' ? primaryColor : 'transparent',
                color: activeTab === 'links' ? '#FFFFFF' : undefined
              }}
            >
              {t('users.tabs.links', 'Enlaces')}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'links' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                {inviteLinks.length}
              </span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-opacity ${isDark ? 'group-focus-within:opacity-70 opacity-40' : 'group-focus-within:opacity-50 opacity-30'}`} style={{ color: isDark ? '#FFFFFF' : '#0F172A' }} />
              <input
                type="text"
                placeholder={activeTab === 'users' ? t('users.placeholders.search') : t('users.placeholders.searchInvitations', 'Buscar invitaciones...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all duration-300"
                style={{
                  backgroundColor: 'var(--org-card-background, #1E2329)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: 'var(--org-text-color, #FFFFFF)'
                }}
              />
            </div>

          {/* Role Filter */}
          <div className="relative min-w-[140px]">
            <button
              type="button"
              onClick={() => {
                setIsRoleDropdownOpen(!isRoleDropdownOpen)
                setIsStatusDropdownOpen(false)
                setIsRegionDropdownOpen(false)
                setIsZoneDropdownOpen(false)
                setIsTeamDropdownOpen(false)
              }}
              className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
              style={{
                backgroundColor: 'var(--org-card-background, #1E2329)',
                borderColor: filterRole !== 'all' ? primaryColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: 'var(--org-text-color, #FFFFFF)'
              }}
            >
              <span className="text-sm truncate">
                {filterRole === 'all' ? t('users.roles.all') :
                  filterRole === 'owner' ? t('users.roles.owner') :
                    filterRole === 'admin' ? t('users.roles.admin') : t('users.roles.member')}
              </span>
              <motion.svg animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }} className="w-4 h-4 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            <AnimatePresence>
              {isRoleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                  style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  {[
                    { value: 'all', label: t('users.roles.all') },
                    { value: 'owner', label: t('users.roles.owner') },
                    { value: 'admin', label: t('users.roles.admin') },
                    { value: 'member', label: t('users.roles.member') }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setFilterRole(option.value); setIsRoleDropdownOpen(false) }}
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                      style={{ backgroundColor: filterRole === option.value ? `${primaryColor}20` : 'transparent', color: filterRole === option.value ? (isDark ? '#FFFFFF' : primaryColor) : (isDark ? 'rgba(255,255,255,0.7)' : '#374151') }}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[140px]">
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen)
                setIsRoleDropdownOpen(false)
                setIsRegionDropdownOpen(false)
                setIsZoneDropdownOpen(false)
                setIsTeamDropdownOpen(false)
              }}
              className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
              style={{
                backgroundColor: 'var(--org-card-background, #1E2329)',
                borderColor: filterStatus !== 'all' ? accentColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: 'var(--org-text-color, #FFFFFF)'
              }}
            >
              <span className="text-sm truncate">
                {filterStatus === 'all' ? t('users.status.all') :
                  filterStatus === 'active' ? t('users.status.active') :
                    filterStatus === 'invited' ? t('users.status.invited') : t('users.status.suspended')}
              </span>
              <motion.svg animate={{ rotate: isStatusDropdownOpen ? 180 : 0 }} className="w-4 h-4 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            <AnimatePresence>
              {isStatusDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                  style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  {[
                    { value: 'all', label: t('users.status.all') },
                    { value: 'active', label: t('users.status.active') },
                    { value: 'invited', label: t('users.status.invited') },
                    { value: 'suspended', label: t('users.status.suspended') }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setFilterStatus(option.value); setIsStatusDropdownOpen(false) }}
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                      style={{ backgroundColor: filterStatus === option.value ? `${accentColor}20` : 'transparent', color: filterStatus === option.value ? (isDark ? '#FFFFFF' : accentColor) : (isDark ? 'rgba(255,255,255,0.7)' : '#374151') }}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-3.5 rounded-xl border-2 flex items-center gap-2 transition-all duration-300 ${showAdvancedFilters ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
            style={{
              backgroundColor: showAdvancedFilters ? `${primaryColor}20` : 'var(--org-card-background, #1E2329)',
              borderColor: showAdvancedFilters || activeFiltersCount > 0 ? primaryColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: 'var(--org-text-color, #FFFFFF)'
            }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{t('users.filters.advanced', 'Más filtros')}</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}>
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border-2 overflow-hidden" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', backgroundColor: 'var(--org-card-background, #1E2329)' }}>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${viewMode === 'cards' ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
              style={{ backgroundColor: viewMode === 'cards' ? `${primaryColor}30` : 'transparent' }}
              title={t('users.view.cards', 'Vista tarjetas')}
            >
              <LayoutGrid 
                className="w-5 h-5" 
                style={{ 
                  color: viewMode === 'cards' ? primaryColor : 'rgba(255,255,255,0.7)',
                  strokeWidth: viewMode === 'cards' ? 2.5 : 2
                }} 
              />
            </button>
            <div className="w-px h-6" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
            <button
              onClick={() => setViewMode('list')}
              className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${viewMode === 'list' ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
              style={{ backgroundColor: viewMode === 'list' ? `${primaryColor}30` : 'transparent' }}
              title={t('users.view.list', 'Vista lista')}
            >
              <List 
                className="w-5 h-5" 
                style={{ 
                  color: viewMode === 'list' ? primaryColor : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)',
                  strokeWidth: viewMode === 'list' ? 2.5 : 2
                }} 
              />
            </button>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-white/10"
              style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
            >
              {/* Region Filter */}
              {uniqueRegions.length > 0 && (
                <div className="relative min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegionDropdownOpen(!isRegionDropdownOpen)
                      setIsRoleDropdownOpen(false)
                      setIsStatusDropdownOpen(false)
                      setIsZoneDropdownOpen(false)
                      setIsTeamDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: filterRegion !== 'all' ? accentColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-4 h-4 opacity-60 flex-shrink-0" />
                      <span className="truncate">{filterRegion === 'all' ? t('users.filters.allRegions', 'Todas las regiones') : filterRegion}</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isRegionDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}>
                        <button onClick={() => { setFilterRegion('all'); setIsRegionDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterRegion === 'all' ? `${accentColor}20` : 'transparent' }}>{t('users.filters.allRegions', 'Todas las regiones')}</button>
                        {uniqueRegions.map(region => (
                          <button key={region} onClick={() => { setFilterRegion(region || ''); setIsRegionDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterRegion === region ? `${accentColor}20` : 'transparent' }}>{region}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Zone Filter */}
              {uniqueZones.length > 0 && (
                <div className="relative min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsZoneDropdownOpen(!isZoneDropdownOpen)
                      setIsRoleDropdownOpen(false)
                      setIsStatusDropdownOpen(false)
                      setIsRegionDropdownOpen(false)
                      setIsTeamDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: filterZone !== 'all' ? accentColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-4 h-4 opacity-60 flex-shrink-0" />
                      <span className="truncate">{filterZone === 'all' ? t('users.filters.allZones', 'Todas las zonas') : filterZone}</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isZoneDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}>
                        <button onClick={() => { setFilterZone('all'); setIsZoneDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterZone === 'all' ? `${accentColor}20` : 'transparent' }}>{t('users.filters.allZones', 'Todas las zonas')}</button>
                        {uniqueZones.map(zone => (
                          <button key={zone} onClick={() => { setFilterZone(zone || ''); setIsZoneDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterZone === zone ? `${accentColor}20` : 'transparent' }}>{zone}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Team Filter */}
              {uniqueTeams.length > 0 && (
                <div className="relative min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamDropdownOpen(!isTeamDropdownOpen)
                      setIsRoleDropdownOpen(false)
                      setIsStatusDropdownOpen(false)
                      setIsRegionDropdownOpen(false)
                      setIsZoneDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: filterTeam !== 'all' ? accentColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Network className="w-4 h-4 opacity-60 flex-shrink-0" />
                      <span className="truncate">{filterTeam === 'all' ? t('users.filters.allTeams', 'Todos los equipos') : filterTeam}</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isTeamDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}>
                        <button onClick={() => { setFilterTeam('all'); setIsTeamDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterTeam === 'all' ? `${accentColor}20` : 'transparent' }}>{t('users.filters.allTeams', 'Todos los equipos')}</button>
                        {uniqueTeams.map(team => (
                          <button key={team} onClick={() => { setFilterTeam(team || ''); setIsTeamDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterTeam === team ? `${accentColor}20` : 'transparent' }}>{team}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t('users.filters.clear', 'Limpiar filtros')}
                </button>
              )}

              {/* Results Count */}
              <div className="ml-auto text-sm opacity-60">
                {filteredUsers.length} {t('users.filters.results', 'resultados')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Grid/List or Empty State */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          filteredUsers.length === 0 ? (
            <EmptyState
              key="empty-users"
              onAddClick={() => setIsAddModalOpen(true)}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"
            >
              {filteredUsers.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  index={index}
                  primaryColor={primaryColor}
                  onEdit={() => { setEditingUser(user); setIsEditModalOpen(true) }}
                  onDelete={() => { setDeletingUser(user); setIsDeleteModalOpen(true) }}
                  onStats={() => { setStatsUser(user); setIsStatsModalOpen(true) }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                  onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                  onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* List Header */}
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.name', 'Nombre')}</div>
                <div>{t('users.list.hierarchy', 'Ubicación')}</div>
                <div>{t('users.list.role', 'Rol / Estado')}</div>
                <div className="text-right">{t('users.list.lastAccess', 'Último acceso')}</div>
              </div>
              {filteredUsers.map((user, index) => (
                <UserListRow
                  key={user.id}
                  user={user}
                  index={index}
                  primaryColor={primaryColor}
                  onEdit={() => { setEditingUser(user); setIsEditModalOpen(true) }}
                  onDelete={() => { setDeletingUser(user); setIsDeleteModalOpen(true) }}
                  onStats={() => { setStatsUser(user); setIsStatsModalOpen(true) }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                  onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                  onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
                />
              ))}
            </motion.div>
          )
        ) : activeTab === 'invitations' ? (
          /* Invitations Tab Content */
          filteredInvitations.length === 0 ? (
            <div key="empty-invitations" className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-white/5 bg-white/5">
              <Mail className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="text-xl font-bold opacity-60">No hay invitaciones pendientes</h3>
              <p className="text-sm opacity-40 max-w-xs mx-auto mt-2">
                Todas tus invitaciones han sido aceptadas o no has enviado ninguna recientemente.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-invitations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredInvitations.map((inv, index) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  index={index}
                  primaryColor={primaryColor}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-invitations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* List Header */}
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.invitation', 'Invitación')}</div>
                <div>{t('users.list.sent', 'Enviada')}</div>
                <div>{t('users.list.status', 'Estado')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {filteredInvitations.map((inv, index) => (
                <InvitationListRow
                  key={inv.id}
                  invitation={inv}
                  index={index}
                  primaryColor={primaryColor}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          )
        ) : (
          /* Invite Links Tab Content */
          inviteLinks.length === 0 ? (
            <div key="empty-links" className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-white/5 bg-white/5">
              <Link2 className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="text-xl font-bold opacity-60">No hay enlaces activos</h3>
              <p className="text-sm opacity-40 max-w-xs mx-auto mt-2">
                Crea enlaces de invitación masiva para compartir con grupos grandes.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {inviteLinks.map((link, index) => (
                <InviteLinkCard
                  key={link.id}
                  link={link}
                  index={index}
                  primaryColor={primaryColor}
                  onToggleStatus={() => updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')}
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* List Header */}
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-1 lg:col-span-1">{t('users.list.link', 'Enlace')}</div>
                <div>{t('users.list.usage', 'Uso / Disponibles')}</div>
                <div>{t('users.list.expires', 'Vencimiento')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {inviteLinks.map((link, index) => (
                <InviteLinkRow
                  key={link.id}
                  link={link}
                  index={index}
                  primaryColor={primaryColor}
                  onToggleStatus={() => updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')}
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewUser} />
      <EditUserModal user={editingUser} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null) }} onSave={async (id, data) => { await updateUser(id, data) }} />
      <DeleteUserModal user={deletingUser} isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingUser(null) }} onConfirm={async () => { if (deletingUser) await deleteUser(deletingUser.id) }} />
      <ImportUsersModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportComplete={() => { refetch(); setIsImportModalOpen(false) }} />
      {statsUser && <UserStatsModal user={statsUser} isOpen={isStatsModalOpen} onClose={() => { setIsStatsModalOpen(false); setStatsUser(null) }} />}
      <UnifiedInviteModal
        isOpen={isUnifiedInviteModalOpen}
        onClose={() => setIsUnifiedInviteModalOpen(false)}
        onInviteSent={() => refetch()}
        onLinkCreated={() => refetch()}
        organizationId={orgData?.id || undefined}
        organizationSlug={orgSlug}
      />
      
      {/* Toast Notifications */}
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  )
}
