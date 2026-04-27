'use client'

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
  formatCompanyPlan,
  getCompanyStatusInfo,
  getCompanyUsagePercent,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'
import { AdminButton, AdminStatusBadge, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

interface AdminCompanyCardProps {
  company: AdminCompany
  onView: () => void
  onEdit: () => void
  onToggle: () => void
  onActivate?: () => void
  isUpdating: boolean
  themeColors: AdminCompaniesThemeColors
}

function getStatusTone(company: AdminCompany) {
  if (company.subscription_status?.toLowerCase() === 'pending' && !company.is_active) return 'warning' as const
  if (!company.is_active) return 'warning' as const
  if (company.subscription_status?.toLowerCase() === 'expired') return 'danger' as const
  if (company.subscription_status?.toLowerCase() === 'trial') return 'info' as const
  return 'success' as const
}

export function AdminCompanyCard({
  company,
  onView,
  onEdit,
  onToggle,
  onActivate,
  isUpdating,
}: AdminCompanyCardProps) {
  const theme = useAdminTheme()
  const statusInfo = getCompanyStatusInfo(company)
  const planInfo = formatCompanyPlan(company.subscription_plan)
  const usagePercent = getCompanyUsagePercent(company)
  const StatusIcon = statusInfo.icon

  return (
    <AdminSurface className="overflow-hidden p-5" interactive>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
            style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}
          >
            {company.brand_logo_url || company.logo_url ? (
              <img
                src={company.brand_logo_url || company.logo_url || undefined}
                alt={company.name}
                className="h-full w-full object-contain p-1.5"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <BuildingOffice2Icon className="h-6 w-6" style={{ color: theme.textMuted }} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold" style={{ color: theme.text }}>
              {company.name}
            </h3>
            <p className="truncate text-sm" style={{ color: theme.textMuted }}>
              {company.slug || 'Sin slug'}
            </p>
          </div>
        </div>

        <AdminStatusBadge tone={getStatusTone(company)} className="shrink-0">
          <StatusIcon className="h-3.5 w-3.5" />
          {statusInfo.label}
        </AdminStatusBadge>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AdminStatusBadge tone="primary">Plan {planInfo.label}</AdminStatusBadge>
        {company.contact_email ? (
          <AdminStatusBadge tone="neutral">
            <EnvelopeIcon className="h-3.5 w-3.5" />
            {company.contact_email.split('@')[0]}...
          </AdminStatusBadge>
        ) : null}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          ['Activos', company.active_users],
          ['Total', company.total_users],
          ['Uso', `${usagePercent}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: theme.surfaceSubtle }}>
            <p className="text-lg font-bold" style={{ color: theme.text }}>{value}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-xs" style={{ color: theme.textMuted }}>
          <span>Uso de licencias</span>
          <span>{company.active_users} / {company.max_users || 'Sin limite'}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.surfaceSubtle }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              backgroundColor:
                usagePercent > 90
                  ? theme.danger
                  : usagePercent > 70
                    ? theme.warning
                    : theme.accent,
              width: `${usagePercent}%`,
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AdminButton onClick={onView} variant="secondary" icon={EyeIcon} className="flex-1">
          Ver
        </AdminButton>

        {company.subscription_status?.toLowerCase() === 'pending' && !company.is_active && onActivate ? (
          <AdminButton
            onClick={onActivate}
            disabled={isUpdating}
            variant="success"
            icon={isUpdating ? ArrowPathIcon : CheckCircleIcon}
            className="flex-1"
          >
            Activar
          </AdminButton>
        ) : (
          <>
            <AdminButton onClick={onEdit} variant="secondary" icon={PencilSquareIcon} className="flex-1">
              Editar
            </AdminButton>
            <AdminButton
              onClick={onToggle}
              disabled={isUpdating}
              variant={company.is_active ? 'secondary' : 'success'}
              icon={isUpdating ? ArrowPathIcon : company.is_active ? PauseCircleIcon : CheckCircleIcon}
              size="icon"
              title={company.is_active ? 'Pausar empresa' : 'Activar empresa'}
            />
          </>
        )}
      </div>
    </AdminSurface>
  )
}
