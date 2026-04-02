'use client'

import { motion } from 'framer-motion'
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  EnvelopeIcon,
  EyeIcon,
  PauseCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'

import type { AdminCompany } from '../../types/admin-companies.types'
import {
  adminCompaniesColors,
  formatCompanyPlan,
  getCompanyStatusInfo,
  getCompanyUsagePercent,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'

interface AdminCompanyCardProps {
  company: AdminCompany
  onView: () => void
  onEdit: () => void
  onToggle: () => void
  onActivate?: () => void
  isUpdating: boolean
  themeColors: AdminCompaniesThemeColors
}

export function AdminCompanyCard({
  company,
  onView,
  onEdit,
  onToggle,
  onActivate,
  isUpdating,
  themeColors,
}: AdminCompanyCardProps) {
  const statusInfo = getCompanyStatusInfo(company)
  const planInfo = formatCompanyPlan(company.subscription_plan)
  const usagePercent = getCompanyUsagePercent(company)
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="relative group overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: themeColors.cardBackground,
        borderColor: `${themeColors.borderColor}20`,
      }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${adminCompaniesColors.accent}05, transparent)` }}
      />

      <div className="relative z-10 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl"
              style={{
                backgroundColor: `${adminCompaniesColors.grayMedium}20`,
                border: `1px solid ${adminCompaniesColors.grayMedium}30`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {company.brand_logo_url || company.logo_url ? (
                <img
                  src={company.brand_logo_url || company.logo_url || undefined}
                  alt={company.name}
                  className="h-full w-full object-contain p-1"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <BuildingOffice2Icon className="h-7 w-7" style={{ color: adminCompaniesColors.grayMedium }} />
              )}
            </motion.div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: themeColors.textPrimary }}>
                {company.name}
              </h3>
              <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                {company.slug || 'Sin slug'}
              </p>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: statusInfo.bgColor,
              color: statusInfo.color,
            }}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.label}
          </motion.div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span
            className="rounded-lg px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${planInfo.color}20`,
              color: planInfo.color,
            }}
          >
            Plan {planInfo.label}
          </span>
          {company.contact_email && (
            <span
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
              style={{
                backgroundColor: `${adminCompaniesColors.grayMedium}10`,
                color: adminCompaniesColors.grayMedium,
              }}
            >
              <EnvelopeIcon className="h-3 w-3" />
              {company.contact_email.split('@')[0]}...
            </span>
          )}
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: themeColors.inputBg }}>
            <p className="text-lg font-bold" style={{ color: themeColors.textPrimary }}>
              {company.active_users}
            </p>
            <p className="text-xs" style={{ color: themeColors.textSecondary }}>
              Activos
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: themeColors.inputBg }}>
            <p className="text-lg font-bold" style={{ color: themeColors.textPrimary }}>
              {company.total_users}
            </p>
            <p className="text-xs" style={{ color: themeColors.textSecondary }}>
              Total
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: themeColors.inputBg }}>
            <p className="text-lg font-bold" style={{ color: adminCompaniesColors.accent }}>
              {usagePercent}%
            </p>
            <p className="text-xs" style={{ color: themeColors.textSecondary }}>
              Uso
            </p>
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-1.5 flex justify-between text-xs" style={{ color: adminCompaniesColors.grayMedium }}>
            <span>Uso de licencias</span>
            <span>
              {company.active_users} / {company.max_users || '∞'}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: `${adminCompaniesColors.grayMedium}20` }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor:
                  usagePercent > 90
                    ? adminCompaniesColors.error
                    : usagePercent > 70
                      ? adminCompaniesColors.warning
                      : adminCompaniesColors.accent,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={(event) => {
              event.stopPropagation()
              onView()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: `${adminCompaniesColors.grayMedium}15`,
              color: 'white',
            }}
          >
            <EyeIcon className="h-4 w-4" />
            Ver
          </motion.button>

          {company.subscription_status?.toLowerCase() === 'pending' && !company.is_active && onActivate ? (
            <motion.button
              onClick={(event) => {
                event.stopPropagation()
                onActivate()
              }}
              disabled={isUpdating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: `${adminCompaniesColors.success}20`,
                color: adminCompaniesColors.success,
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
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: `${adminCompaniesColors.accent}20`,
                  color: adminCompaniesColors.accent,
                }}
              >
                <PencilSquareIcon className="h-4 w-4" />
                Editar
              </motion.button>

              <motion.button
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle()
                }}
                disabled={isUpdating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: company.is_active
                    ? `${adminCompaniesColors.warning}20`
                    : `${adminCompaniesColors.success}20`,
                  color: company.is_active ? adminCompaniesColors.warning : adminCompaniesColors.success,
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
