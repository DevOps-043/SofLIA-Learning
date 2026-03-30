'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOffice2Icon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PauseCircleIcon,
  BoltIcon,
  PencilSquareIcon,
  XMarkIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  SparklesIcon,
  ChartBarIcon,
  ChevronDownIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { AdminCompany } from '../services/adminCompanies.service'
import { AdminEditCompanyModal } from './AdminEditCompanyModal'
import { AdminCreateCompanyModal, CreateCompanyData } from './AdminCreateCompanyModal'
import { useAdminCompaniesLogic } from '../hooks/useAdminCompaniesLogic'

// ============================================
// DESIGN SYSTEM - SOFLIA COLORS
// ============================================
const colors = {
  primary: '#0A2540',
  accent: '#00D4B3',
  accentLight: '#00E5C4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  bgPrimary: '#0F1419',
  bgSecondary: '#1E2329',
  bgTertiary: '#0A0D12',
  grayLight: '#E9ECEF',
  grayMedium: '#6C757D',
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  team: { label: 'Team', color: colors.primary },
  business: { label: 'Business', color: colors.accent },
  enterprise: { label: 'Enterprise', color: colors.purple }
}

function formatPlan(plan?: string | null) {
  if (!plan) return { label: 'Sin plan', color: colors.grayMedium }
  const normalized = plan.toLowerCase()
  return PLAN_LABELS[normalized] || { label: plan, color: colors.grayMedium }
}

function getStatusInfo(company: AdminCompany) {
  if (company.subscription_status?.toLowerCase() === 'pending' && !company.is_active) {
    return {
      label: 'Pendiente',
      color: '#F97316',
      bgColor: '#F9731620',
      icon: ArrowPathIcon
    }
  }
  if (!company.is_active) {
    return {
      label: 'Pausada',
      color: colors.warning,
      bgColor: `${colors.warning}20`,
      icon: PauseCircleIcon
    }
  }
  if (company.subscription_status?.toLowerCase() === 'trial') {
    return {
      label: 'Trial',
      color: colors.purple,
      bgColor: `${colors.purple}20`,
      icon: BoltIcon
    }
  }
  if (company.subscription_status?.toLowerCase() === 'expired') {
    return {
      label: 'Expirada',
      color: colors.error,
      bgColor: `${colors.error}20`,
      icon: ExclamationTriangleIcon
    }
  }
  return {
    label: 'Activa',
    color: colors.success,
    bgColor: `${colors.success}20`,
    icon: CheckCircleIcon
  }
}

// ============================================
// STAT CARD COMPONENT
// ============================================
interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<any>
  color: string
  delay: number
  themeColors?: any
}

function StatCard({ title, value, subtitle, icon: Icon, color, delay, themeColors }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      className="relative group overflow-hidden rounded-2xl border p-6"
      style={{
        backgroundColor: themeColors?.cardBackground || colors.bgSecondary,
        borderColor: `${themeColors?.borderColor || colors.grayMedium}30`
      }}
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${color}20` }}
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </motion.div>
        </div>

        <motion.h3
          className="text-3xl font-bold mb-1"
          style={{ color: themeColors?.textPrimary || 'white' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          {value}
        </motion.h3>

        <p className="font-medium mb-1" style={{ color: colors.grayMedium }}>{title}</p>
        <p className="text-xs" style={{ color: `${colors.grayMedium}80` }}>{subtitle}</p>

        {/* Animated line */}
        <motion.div
          className="absolute bottom-0 left-0 h-1"
          style={{ background: `linear-gradient(to right, ${color}, ${colors.primary})` }}
          initial={{ width: 0 }}
          animate={{ width: '30%' }}
          transition={{ delay: delay * 0.1 + 0.4, duration: 0.8 }}
        />
      </div>
    </motion.div>
  )
}

// ============================================
// COMPANY CARD COMPONENT
// ============================================
interface CompanyCardProps {
  company: AdminCompany
  onView: () => void
  onEdit: () => void
  onToggle: () => void
  onActivate?: () => void
  isUpdating: boolean
  themeColors?: any
}

function CompanyCard({ company, onView, onEdit, onToggle, onActivate, isUpdating, themeColors }: CompanyCardProps) {
  const statusInfo = getStatusInfo(company)
  const planInfo = formatPlan(company.subscription_plan)
  const StatusIcon = statusInfo.icon
  const usagePercent = company.max_users ? Math.min(100, Math.round((company.active_users / company.max_users) * 100)) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="relative group overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: themeColors?.cardBackground || colors.bgSecondary,
        borderColor: `${themeColors?.borderColor || colors.grayMedium}20`
      }}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${colors.accent}05, transparent)` }}
      />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.div
              className="h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: `${colors.grayMedium}20`,
                border: `1px solid ${colors.grayMedium}30`
              }}
              whileHover={{ scale: 1.05 }}
            >
              {company.brand_logo_url || company.logo_url ? (
                <img
                  src={company.brand_logo_url || company.logo_url || undefined}
                  alt={company.name}
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <BuildingOffice2Icon className="h-7 w-7" style={{ color: colors.grayMedium }} />
              )}
            </motion.div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: themeColors?.textPrimary || 'white' }}>{company.name}</h3>
              <p className="text-sm" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>
                {company.slug || 'Sin slug'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: statusInfo.bgColor,
              color: statusInfo.color
            }}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.label}
          </motion.div>
        </div>

        {/* Plan Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: `${planInfo.color}20`,
              color: planInfo.color
            }}
          >
            Plan {planInfo.label}
          </span>
          {company.contact_email && (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{
                backgroundColor: `${colors.grayMedium}10`,
                color: colors.grayMedium
              }}
            >
              <EnvelopeIcon className="h-3 w-3" />
              {company.contact_email.split('@')[0]}...
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: themeColors?.inputBg || colors.bgTertiary }}
          >
            <p className="text-lg font-bold" style={{ color: themeColors?.textPrimary || 'white' }}>{company.active_users}</p>
            <p className="text-xs" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>Activos</p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: themeColors?.inputBg || colors.bgTertiary }}
          >
            <p className="text-lg font-bold" style={{ color: themeColors?.textPrimary || 'white' }}>{company.total_users}</p>
            <p className="text-xs" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>Total</p>
          </div>
          <div
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: themeColors?.inputBg || colors.bgTertiary }}
          >
            <p className="text-lg font-bold" style={{ color: colors.accent }}>{usagePercent}%</p>
            <p className="text-xs" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>Uso</p>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: colors.grayMedium }}>
            <span>Uso de licencias</span>
            <span>{company.active_users} / {company.max_users || 'âˆž'}</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${colors.grayMedium}20` }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: usagePercent > 90 ? colors.error : usagePercent > 70 ? colors.warning : colors.accent
              }}
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onView() }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: `${colors.grayMedium}15`,
              color: 'white'
            }}
          >
            <EyeIcon className="h-4 w-4" />
            Ver
          </motion.button>

          {company.subscription_status?.toLowerCase() === 'pending' && !company.is_active && onActivate ? (
            <motion.button
              onClick={(e) => { e.stopPropagation(); onActivate() }}
              disabled={isUpdating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: `${colors.success}20`,
                color: colors.success
              }}
            >
              {isUpdating ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Activar
                </>
              )}
            </motion.button>
          ) : (
            <>
              <motion.button
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: `${colors.accent}20`,
                  color: colors.accent
                }}
              >
                <PencilSquareIcon className="h-4 w-4" />
                Editar
              </motion.button>

              <motion.button
                onClick={(e) => { e.stopPropagation(); onToggle() }}
                disabled={isUpdating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: company.is_active ? `${colors.warning}20` : `${colors.success}20`,
                  color: company.is_active ? colors.warning : colors.success
                }}
              >
                {isUpdating ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : company.is_active ? (
                  <PauseCircleIcon className="h-4 w-4" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// VIEW MODAL COMPONENT
// ============================================
interface ViewModalProps {
  company: AdminCompany
  onClose: () => void
  onEdit: () => void
  themeColors?: any
}

function ViewModal({ company, onClose, onEdit, themeColors }: ViewModalProps) {
  const router = useRouter()
  const statusInfo = getStatusInfo(company)
  const planInfo = formatPlan(company.subscription_plan)
  const StatusIcon = statusInfo.icon

  // Obtener owner y admins
  const owner = company.members?.find(m => m.role === 'owner')
  const admins = company.members?.filter(m => m.role === 'admin') || []

  const getUserDisplayName = (user?: { email: string; first_name: string | null; last_name: string | null; display_name: string | null; username: string | null }) => {
    if (!user) return 'Usuario'
    if (user.display_name) return user.display_name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    if (user.first_name) return user.first_name
    if (user.username) return user.username
    return user.email.split('@')[0]
  }

  const handleNavigateToEdit = () => {
    onClose()
    router.push(`/admin/companies/${company.id}/edit`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(10, 13, 18, 0.95)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl my-8 rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: themeColors?.cardBackground || colors.bgSecondary }}
      >
        {/* Banner */}
        <div
          className="relative h-40 w-full"
          style={{
            backgroundColor: themeColors?.inputBg || colors.bgTertiary,
            backgroundImage: company.brand_banner_url ? `url(${company.brand_banner_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!company.brand_banner_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-full h-full opacity-30"
                style={{ background: `linear-gradient(135deg, ${colors.accent}40, ${colors.primary}60)` }}
              />
            </div>
          )}

          {/* Close button */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3 p-2 rounded-lg backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </motion.button>

          {/* Logo overlay */}
          <div className="absolute -bottom-12 left-6">
            <div
              className="h-24 w-24 rounded-2xl flex items-center justify-center overflow-hidden border-4 shadow-lg"
              style={{
                backgroundColor: themeColors?.cardBackground || colors.bgSecondary,
                borderColor: themeColors?.cardBackground || colors.bgSecondary
              }}
            >
              {company.logo_url || company.brand_logo_url ? (
                <img
                  src={company.brand_logo_url || company.logo_url || undefined}
                  alt={company.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <BuildingOffice2Icon className="h-12 w-12" style={{ color: colors.grayMedium }} />
              )}
            </div>
          </div>

          {/* Favicon */}
          {company.brand_favicon_url && (
            <div className="absolute -bottom-5 left-32">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden border-3 shadow-md"
                style={{
                  backgroundColor: themeColors?.cardBackground || colors.bgSecondary,
                  borderColor: themeColors?.cardBackground || colors.bgSecondary,
                  borderWidth: '3px'
                }}
              >
                <img
                  src={company.brand_favicon_url}
                  alt="favicon"
                  className="h-8 w-8 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Header Content */}
        <div className="pt-16 px-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: themeColors?.textPrimary || 'white' }}>{company.name}</h2>
              <p className="text-sm mt-1" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>
                /{company.slug || 'sin-slug'}
              </p>
              {company.description && (
                <p className="text-sm mt-2 text-white/70 line-clamp-2">{company.description}</p>
              )}
            </div>
            <motion.button
              onClick={onEdit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              <PencilSquareIcon className="h-4 w-4" />
              Editar
            </motion.button>
          </div>

          {/* Status & Plan Badges */}
          <div className="flex items-center gap-2 mt-4">
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </span>
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: `${planInfo.color}20`, color: planInfo.color }}
            >
              Plan {planInfo.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Owner & Admins */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: themeColors?.inputBg || colors.bgTertiary }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.accent }}>
              Administradores
            </h3>
            <div className="space-y-3">
              {/* Owner */}
              {owner && (
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: `${colors.warning}20` }}
                  >
                    {owner.user?.profile_picture_url ? (
                      <img src={owner.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: colors.warning }}>
                        {getUserDisplayName(owner.user).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: themeColors?.textPrimary || 'white' }}>{getUserDisplayName(owner.user)}</p>
                    <p className="text-xs truncate" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>{owner.user?.email}</p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                    style={{ backgroundColor: `${colors.warning}20`, color: colors.warning }}
                  >
                    Owner
                  </span>
                </div>
              )}

              {/* Admins */}
              {admins.map(admin => (
                <div key={admin.id} className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    {admin.user?.profile_picture_url ? (
                      <img src={admin.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: colors.accent }}>
                        {getUserDisplayName(admin.user).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: themeColors?.textPrimary || 'white' }}>{getUserDisplayName(admin.user)}</p>
                    <p className="text-xs truncate" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>{admin.user?.email}</p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                    style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                  >
                    Admin
                  </span>
                </div>
              ))}

              {!owner && admins.length === 0 && (
                <p className="text-sm text-center py-2" style={{ color: colors.grayMedium }}>
                  Sin administradores asignados
                </p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: themeColors?.inputBg || colors.bgTertiary }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.accent }}>
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <EnvelopeIcon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: themeColors?.textSecondary || colors.grayMedium }} />
                <div>
                  <p className="text-[10px] uppercase" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>Email</p>
                  <p className="text-sm break-all" style={{ color: themeColors?.textPrimary || 'white' }}>{company.contact_email || 'No definido'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <PhoneIcon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: themeColors?.textSecondary || colors.grayMedium }} />
                <div>
                  <p className="text-[10px] uppercase" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>Teléfono</p>
                  <p className="text-sm" style={{ color: themeColors?.textPrimary || 'white' }}>{company.contact_phone || 'No definido'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 md:col-span-2">
                <GlobeAltIcon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: themeColors?.textSecondary || colors.grayMedium }} />
                <div>
                  <p className="text-[10px] uppercase" style={{ color: themeColors?.textSecondary || colors.grayMedium }}>Sitio Web</p>
                  <p className="text-sm break-all" style={{ color: themeColors?.textPrimary || 'white' }}>{company.website_url || 'No definido'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Grid */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: themeColors?.inputBg || colors.bgTertiary }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.accent }}>
              Usuarios ({company.total_users})
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div
                className="text-center p-3 rounded-lg"
                style={{ backgroundColor: `${colors.success}15` }}
              >
                <p className="text-xl font-bold" style={{ color: colors.success }}>{company.active_users}</p>
                <p className="text-[10px]" style={{ color: colors.grayMedium }}>Activos</p>
              </div>
              <div
                className="text-center p-3 rounded-lg"
                style={{ backgroundColor: `${colors.warning}15` }}
              >
                <p className="text-xl font-bold" style={{ color: colors.warning }}>{company.invited_users}</p>
                <p className="text-[10px]" style={{ color: colors.grayMedium }}>Invitados</p>
              </div>
              <div
                className="text-center p-3 rounded-lg"
                style={{ backgroundColor: `${colors.error}15` }}
              >
                <p className="text-xl font-bold" style={{ color: colors.error }}>{company.suspended_users}</p>
                <p className="text-[10px]" style={{ color: colors.grayMedium }}>Suspendidos</p>
              </div>
              <div
                className="text-center p-3 rounded-lg"
                style={{ backgroundColor: `${colors.accent}15` }}
              >
                <p className="text-xl font-bold" style={{ color: colors.accent }}>{company.max_users || 'âˆž'}</p>
                <p className="text-[10px]" style={{ color: colors.grayMedium }}>Máximo</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            onClick={handleNavigateToEdit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors"
            style={{ backgroundColor: colors.accent, color: colors.primary }}
          >
            <PencilSquareIcon className="h-4 w-4" />
            Editar información de la empresa
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function AdminCompaniesPage() {
  const {
    companies, stats, isLoading, error, refetch, updatingId, actionError,
    searchTerm, setSearchTerm,
    planFilter, setPlanFilter,
    statusFilter, setStatusFilter,
    viewCompany, setViewCompany,
    editCompany, setEditCompany,
    isSaving,
    showCreateModal, setShowCreateModal,
    isCreating,
    themeColors,
    filteredCompanies,
    handleToggle,
    handleActivatePending,
    handleSaveEdit,
    handleCreateCompany,
  } = useAdminCompaniesLogic()



  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen" style={{ backgroundColor: themeColors.background }}>
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-800 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-800 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-2xl border text-center max-w-md"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: `${colors.error}30`
          }}
        >
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" style={{ color: colors.error }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>Error al cargar</h2>
          <p style={{ color: colors.grayMedium }} className="mb-6">{error}</p>
          <motion.button
            onClick={refetch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto"
            style={{ backgroundColor: colors.accent, color: colors.primary }}
          >
            <ArrowPathIcon className="h-5 w-5" />
            Reintentar
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen transition-colors duration-300" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="h-5 w-5" style={{ color: colors.accent }} />
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: colors.accent }}>
                Gestión B2B
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold" style={{ color: themeColors.textPrimary }}>
              Administración de Empresas
            </h1>
            <p style={{ color: themeColors.textSecondary }} className="mt-2">
              Gestiona organizaciones, planes y usuarios empresariales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={refetch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium"
              style={{ backgroundColor: `${colors.grayMedium}20`, color: 'white' }}
            >
              <ArrowPathIcon className="h-5 w-5" />
              Actualizar
            </motion.button>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium"
              style={{ backgroundColor: colors.success, color: 'white' }}
            >
              <BuildingOffice2Icon className="h-5 w-5" />
              Nueva Organización
            </motion.button>

          </div>
        </div>
      </motion.header>

      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border flex items-center gap-3"
          style={{
            backgroundColor: `${colors.warning}10`,
            borderColor: `${colors.warning}30`
          }}
        >
          <ExclamationTriangleIcon className="h-5 w-5" style={{ color: colors.warning }} />
          <p className="text-sm" style={{ color: colors.warning }}>{actionError}</p>
        </motion.div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Empresas Activas"
          value={stats?.activeCompanies ?? 0}
          subtitle={`de ${stats?.totalCompanies ?? 0} registradas`}
          icon={CheckCircleIcon}
          color={colors.success}
          delay={0}
          themeColors={themeColors}
        />
        <StatCard
          title="Pendientes"
          value={stats?.pendingCompanies ?? 0}
          subtitle="Requieren activación"
          icon={ArrowPathIcon}
          color="#F97316"
          delay={1}
          themeColors={themeColors}
        />
        <StatCard
          title="En Trial"
          value={stats?.trialCompanies ?? 0}
          subtitle="Conversiones prioritarias"
          icon={BoltIcon}
          color={colors.purple}
          delay={2}
          themeColors={themeColors}
        />
        <StatCard
          title="Pausadas"
          value={stats?.pausedCompanies ?? 0}
          subtitle="Revisar facturación"
          icon={PauseCircleIcon}
          color={colors.warning}
          delay={3}
          themeColors={themeColors}
        />
        <StatCard
          title="Uso Promedio"
          value={`${stats?.averageUtilization ?? 0}%`}
          subtitle={`${stats?.usedSeats ?? 0} / ${stats?.totalSeats ?? 0} licencias`}
          icon={ChartBarIcon}
          color={colors.accent}
          delay={4}
          themeColors={themeColors}
        />
      </section>

      {/* Filters */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8 p-5 rounded-2xl border transition-colors"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: `${themeColors.borderColor}30`
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: colors.grayMedium }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, slug o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: `${themeColors.borderColor}30`,
                backgroundColor: themeColors.inputBg,
                color: themeColors.textPrimary
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: `${themeColors.borderColor}30`,
                backgroundColor: themeColors.inputBg,
                color: themeColors.textPrimary
              }}
            >
              <option value="all">Todos los planes</option>
              <option value="team">Team</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                borderColor: `${themeColors.borderColor}30`,
                backgroundColor: themeColors.inputBg,
                color: themeColors.textPrimary
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="pending">Pendientes</option>
              <option value="trial">En trial</option>
              <option value="paused">Pausadas</option>
              <option value="expired">Expiradas</option>
            </select>
          </div>

          <div className="text-sm" style={{ color: themeColors.textSecondary }}>
            {filteredCompanies.length} empresas
          </div>
        </div>
      </motion.section>

      {/* Companies Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCompanies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full p-12 rounded-2xl border text-center transition-colors"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: `${themeColors.borderColor}30`
              }}
            >
              <BuildingOffice2Icon className="h-16 w-16 mx-auto mb-4" style={{ color: themeColors.textSecondary }} />
              <p className="text-lg font-medium mb-2" style={{ color: themeColors.textPrimary }}>No se encontraron empresas</p>
              <p style={{ color: themeColors.textSecondary }}>Intenta ajustar los filtros de búsqueda</p>
            </motion.div>
          ) : (
            filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <CompanyCard
                  company={company}
                  onView={() => setViewCompany(company)}
                  onEdit={() => setEditCompany(company)}
                  onToggle={() => handleToggle(company)}
                  onActivate={() => handleActivatePending(company)}
                  isUpdating={updatingId === company.id}
                  themeColors={themeColors}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {viewCompany && (
          <ViewModal
            company={viewCompany}
            onClose={() => setViewCompany(null)}
            onEdit={() => {
              setEditCompany(viewCompany)
              setViewCompany(null)
            }}
            themeColors={themeColors}
          />
        )}
        {editCompany && (
          <AdminEditCompanyModal
            company={editCompany}
            onClose={() => setEditCompany(null)}
            onSave={handleSaveEdit}
            isSaving={isSaving}
          />
        )}
        {showCreateModal && (
          <AdminCreateCompanyModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateCompany}
            isCreating={isCreating}
          />
        )}

      </AnimatePresence>
    </div>
  )
}
