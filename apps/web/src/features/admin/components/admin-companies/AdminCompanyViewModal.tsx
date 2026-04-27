'use client'

import { useRouter } from 'next/navigation'
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'

import type { AdminCompany } from '../../types/admin-companies.types'
import {
  formatCompanyPlan,
  getAdminCompanyUserDisplayName,
  getCompanyStatusInfo,
  type AdminCompaniesThemeColors,
} from '../../services/admin-companies'
import { AdminButton, AdminMetricCard, AdminModalShell, AdminStatusBadge, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'

interface AdminCompanyViewModalProps {
  company: AdminCompany
  onClose: () => void
  onEdit: () => void
  themeColors: AdminCompaniesThemeColors
}

function getStatusTone(company: AdminCompany) {
  if (company.subscription_status?.toLowerCase() === 'pending' && !company.is_active) return 'warning' as const
  if (!company.is_active) return 'warning' as const
  if (company.subscription_status?.toLowerCase() === 'expired') return 'danger' as const
  if (company.subscription_status?.toLowerCase() === 'trial') return 'info' as const
  return 'success' as const
}

export function AdminCompanyViewModal({
  company,
  onClose,
  onEdit,
}: AdminCompanyViewModalProps) {
  const router = useRouter()
  const theme = useAdminTheme()
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
    <AdminModalShell
      isOpen
      onClose={onClose}
      icon={BuildingOffice2Icon}
      title={company.name}
      description={`/${company.slug || 'sin-slug'}`}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AdminButton onClick={onClose} variant="secondary">Cerrar</AdminButton>
          <AdminButton onClick={handleNavigateToEdit} icon={PencilSquareIcon}>Editar informacion</AdminButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
              style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}
            >
              {company.logo_url || company.brand_logo_url ? (
                <img
                  src={company.brand_logo_url || company.logo_url || undefined}
                  alt={company.name}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <BuildingOffice2Icon className="h-8 w-8" style={{ color: theme.textMuted }} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold" style={{ color: theme.text }}>
                {company.name}
              </h3>
              {company.description ? (
                <p className="mt-1 line-clamp-2 text-sm" style={{ color: theme.textMuted }}>
                  {company.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge tone={getStatusTone(company)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </AdminStatusBadge>
            <AdminStatusBadge tone="primary">Plan {planInfo.label}</AdminStatusBadge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <AdminMetricCard label="Activos" value={company.active_users} tone="success" />
          <AdminMetricCard label="Invitados" value={company.invited_users} tone="warning" />
          <AdminMetricCard label="Suspendidos" value={company.suspended_users} tone="danger" />
          <AdminMetricCard label="Maximo" value={company.max_users || 'Sin limite'} tone="accent" />
        </div>

        <AdminSurface className="p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
            Administradores
          </h4>
          <div className="space-y-3">
            {owner ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: theme.warningSurface }}>
                  {owner.user?.profile_picture_url ? (
                    <img src={owner.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: theme.warning }}>
                      {getAdminCompanyUserDisplayName(owner.user).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: theme.text }}>
                    {getAdminCompanyUserDisplayName(owner.user)}
                  </p>
                  <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                    {owner.user?.email}
                  </p>
                </div>
                <AdminStatusBadge tone="warning">Owner</AdminStatusBadge>
              </div>
            ) : null}

            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: theme.actionSurface }}>
                  {admin.user?.profile_picture_url ? (
                    <img src={admin.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: theme.accent }}>
                      {getAdminCompanyUserDisplayName(admin.user).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: theme.text }}>
                    {getAdminCompanyUserDisplayName(admin.user)}
                  </p>
                  <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                    {admin.user?.email}
                  </p>
                </div>
                <AdminStatusBadge tone="accent">Admin</AdminStatusBadge>
              </div>
            ))}

            {!owner && admins.length === 0 ? (
              <p className="py-2 text-center text-sm" style={{ color: theme.textMuted }}>
                Sin administradores asignados
              </p>
            ) : null}
          </div>
        </AdminSurface>

        <AdminSurface className="p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
            Informacion de contacto
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <EnvelopeIcon className="mt-0.5 h-4 w-4" style={{ color: theme.textMuted }} />
              <div>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Email</p>
                <p className="break-all text-sm" style={{ color: theme.text }}>{company.contact_email || 'No definido'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <PhoneIcon className="mt-0.5 h-4 w-4" style={{ color: theme.textMuted }} />
              <div>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Telefono</p>
                <p className="text-sm" style={{ color: theme.text }}>{company.contact_phone || 'No definido'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 md:col-span-2">
              <GlobeAltIcon className="mt-0.5 h-4 w-4" style={{ color: theme.textMuted }} />
              <div>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Sitio web</p>
                <p className="break-all text-sm" style={{ color: theme.text }}>{company.website_url || 'No definido'}</p>
              </div>
            </div>
          </div>
        </AdminSurface>

        <AdminButton onClick={onEdit} variant="secondary" icon={PencilSquareIcon} className="w-full">
          Editar sin salir
        </AdminButton>
      </div>
    </AdminModalShell>
  )
}
