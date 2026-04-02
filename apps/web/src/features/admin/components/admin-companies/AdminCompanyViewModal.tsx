'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

import type { AdminCompany } from '../../types/admin-companies.types'
import {
  adminCompaniesColors,
  formatCompanyPlan,
  getAdminCompanyUserDisplayName,
  getCompanyStatusInfo,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompanyViewModalProps {
  company: AdminCompany
  onClose: () => void
  onEdit: () => void
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyViewModal({
  company,
  onClose,
  onEdit,
  themeColors,
}: AdminCompanyViewModalProps) {
  const router = useRouter()
  const statusInfo = getCompanyStatusInfo(company)
  const planInfo = formatCompanyPlan(company.subscription_plan)
  const owner = company.members?.find((member) => member.role === 'owner')
  const admins = company.members?.filter((member) => member.role === 'admin') || []
  const StatusIcon = statusInfo.icon

  const handleNavigateToEdit = () => {
    onClose()
    router.push(`/admin/companies/${company.id}/edit`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{ backgroundColor: 'rgba(10, 13, 18, 0.95)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
        onClick={(event) => event.stopPropagation()}
        className="relative my-8 w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: themeColors.cardBackground }}
      >
        <div
          className="relative h-40 w-full"
          style={{
            backgroundColor: themeColors.inputBg,
            backgroundImage: company.brand_banner_url ? `url(${company.brand_banner_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!company.brand_banner_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-full w-full opacity-30"
                style={{ background: `linear-gradient(135deg, ${adminCompaniesColors.accent}40, ${adminCompaniesColors.primary}60)` }}
              />
            </div>
          )}

          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 top-3 rounded-lg p-2 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
          >
            <XMarkIcon className="h-5 w-5" />
          </motion.button>

          <div className="absolute -bottom-12 left-6">
            <div
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 shadow-lg"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.cardBackground,
              }}
            >
              {company.logo_url || company.brand_logo_url ? (
                <img
                  src={company.brand_logo_url || company.logo_url || undefined}
                  alt={company.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <BuildingOffice2Icon className="h-12 w-12" style={{ color: adminCompaniesColors.grayMedium }} />
              )}
            </div>
          </div>

          {company.brand_favicon_url && (
            <div className="absolute -bottom-5 left-32">
              <div
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl shadow-md"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.cardBackground,
                  borderWidth: '3px',
                }}
              >
                <img src={company.brand_favicon_url} alt="favicon" className="h-8 w-8 object-contain" />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-4 pt-16">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: themeColors.textPrimary }}>
                {company.name}
              </h2>
              <p className="mt-1 text-sm" style={{ color: themeColors.textSecondary }}>
                /{company.slug || 'sin-slug'}
              </p>
              {company.description && <p className="mt-2 line-clamp-2 text-sm text-white/70">{company.description}</p>}
            </div>
            <motion.button
              onClick={onEdit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: `${adminCompaniesColors.accent}20`, color: adminCompaniesColors.accent }}
            >
              <PencilSquareIcon className="h-4 w-4" />
              Editar
            </motion.button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </span>
            <span
              className="rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: `${planInfo.color}20`, color: planInfo.color }}
            >
              Plan {planInfo.label}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: themeColors.inputBg }}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: adminCompaniesColors.accent }}>
              Administradores
            </h3>
            <div className="space-y-3">
              {owner && (
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
                    style={{ backgroundColor: `${adminCompaniesColors.warning}20` }}
                  >
                    {owner.user?.profile_picture_url ? (
                      <img src={owner.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: adminCompaniesColors.warning }}>
                        {getAdminCompanyUserDisplayName(owner.user).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: themeColors.textPrimary }}>
                      {getAdminCompanyUserDisplayName(owner.user)}
                    </p>
                    <p className="truncate text-xs" style={{ color: themeColors.textSecondary }}>
                      {owner.user?.email}
                    </p>
                  </div>
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ backgroundColor: `${adminCompaniesColors.warning}20`, color: adminCompaniesColors.warning }}
                  >
                    Owner
                  </span>
                </div>
              )}

              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
                    style={{ backgroundColor: `${adminCompaniesColors.accent}20` }}
                  >
                    {admin.user?.profile_picture_url ? (
                      <img src={admin.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: adminCompaniesColors.accent }}>
                        {getAdminCompanyUserDisplayName(admin.user).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: themeColors.textPrimary }}>
                      {getAdminCompanyUserDisplayName(admin.user)}
                    </p>
                    <p className="truncate text-xs" style={{ color: themeColors.textSecondary }}>
                      {admin.user?.email}
                    </p>
                  </div>
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ backgroundColor: `${adminCompaniesColors.accent}20`, color: adminCompaniesColors.accent }}
                  >
                    Admin
                  </span>
                </div>
              ))}

              {!owner && admins.length === 0 && (
                <p className="py-2 text-center text-sm" style={{ color: adminCompaniesColors.grayMedium }}>
                  Sin administradores asignados
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: themeColors.inputBg }}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: adminCompaniesColors.accent }}>
              Informacion de Contacto
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-start gap-2">
                <EnvelopeIcon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: themeColors.textSecondary }} />
                <div>
                  <p className="text-[10px] uppercase" style={{ color: themeColors.textSecondary }}>
                    Email
                  </p>
                  <p className="break-all text-sm" style={{ color: themeColors.textPrimary }}>
                    {company.contact_email || 'No definido'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <PhoneIcon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: themeColors.textSecondary }} />
                <div>
                  <p className="text-[10px] uppercase" style={{ color: themeColors.textSecondary }}>
                    Telefono
                  </p>
                  <p className="text-sm" style={{ color: themeColors.textPrimary }}>
                    {company.contact_phone || 'No definido'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 md:col-span-2">
                <GlobeAltIcon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: themeColors.textSecondary }} />
                <div>
                  <p className="text-[10px] uppercase" style={{ color: themeColors.textSecondary }}>
                    Sitio Web
                  </p>
                  <p className="break-all text-sm" style={{ color: themeColors.textPrimary }}>
                    {company.website_url || 'No definido'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: themeColors.inputBg }}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: adminCompaniesColors.accent }}>
              Usuarios ({company.total_users})
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${adminCompaniesColors.success}15` }}>
                <p className="text-xl font-bold" style={{ color: adminCompaniesColors.success }}>
                  {company.active_users}
                </p>
                <p className="text-[10px]" style={{ color: adminCompaniesColors.grayMedium }}>
                  Activos
                </p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${adminCompaniesColors.warning}15` }}>
                <p className="text-xl font-bold" style={{ color: adminCompaniesColors.warning }}>
                  {company.invited_users}
                </p>
                <p className="text-[10px]" style={{ color: adminCompaniesColors.grayMedium }}>
                  Invitados
                </p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${adminCompaniesColors.error}15` }}>
                <p className="text-xl font-bold" style={{ color: adminCompaniesColors.error }}>
                  {company.suspended_users}
                </p>
                <p className="text-[10px]" style={{ color: adminCompaniesColors.grayMedium }}>
                  Suspendidos
                </p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${adminCompaniesColors.accent}15` }}>
                <p className="text-xl font-bold" style={{ color: adminCompaniesColors.accent }}>
                  {company.max_users || '∞'}
                </p>
                <p className="text-[10px]" style={{ color: adminCompaniesColors.grayMedium }}>
                  Maximo
                </p>
              </div>
            </div>
          </div>

          <motion.button
            onClick={handleNavigateToEdit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-colors"
            style={{ backgroundColor: adminCompaniesColors.accent, color: adminCompaniesColors.primary }}
          >
            <PencilSquareIcon className="h-4 w-4" />
            Editar informacion de la empresa
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
