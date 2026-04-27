'use client'

import type { ComponentProps, JSX } from 'react'
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

import { AdminSectionHeader, AdminStatusBadge, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import type {
  AdminDashboardQuickActionIconMap,
  AdminDashboardQuickActionItem,
  AdminDashboardThemeColors,
} from './types'

const quickActionIcons: AdminDashboardQuickActionIconMap = {
  courses: PlusIcon,
  documents: DocumentTextIcon,
  engagement: ChartBarIcon,
  organizations: BuildingOffice2Icon,
  users: UsersIcon,
}

const SafeLink = Link as unknown as (
  props: ComponentProps<typeof Link>
) => JSX.Element

function AdminDashboardQuickAction({
  action,
}: {
  action: AdminDashboardQuickActionItem
}) {
  const theme = useAdminTheme()
  const Icon = quickActionIcons[action.iconKey]

  return (
    <SafeLink href={action.href}>
      <AdminSurface className="group p-4" interactive>
        <div className="flex items-center gap-3">
          <AdminStatusBadge tone={action.tone} className="h-10 w-10 justify-center rounded-xl p-0">
            <Icon className="h-5 w-5" />
          </AdminStatusBadge>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold" style={{ color: theme.text }}>
              {action.title}
            </h4>
            <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: theme.textMuted }}>
              {action.description}
            </p>
          </div>
        </div>
      </AdminSurface>
    </SafeLink>
  )
}

export function AdminDashboardSidebar({
  quickActions,
}: {
  quickActions: AdminDashboardQuickActionItem[]
  themeColors: AdminDashboardThemeColors
}) {
  const theme = useAdminTheme()

  return (
    <aside className="sticky top-24 space-y-6">
      <div>
        <AdminSectionHeader
          className="mb-3"
          title="Acciones rapidas"
          description="Atajos frecuentes para operar la plataforma."
        />
        <div className="space-y-3">
          {quickActions.map((action) => (
            <AdminDashboardQuickAction key={action.title} action={action} />
          ))}
        </div>
      </div>

      <AdminSurface className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
              Salud del sistema
            </h3>
            <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
              Monitoreo operativo
            </p>
          </div>
          <AdminStatusBadge tone="primary">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Activo
          </AdminStatusBadge>
        </div>

        <div className="space-y-3 text-sm">
          {['API', 'Base de datos', 'SofLIA'].map((label) => (
            <div key={label} className="flex items-center justify-between">
              <span style={{ color: theme.textMuted }}>{label}</span>
              <span className="font-semibold" style={{ color: theme.action }}>Operativo</span>
            </div>
          ))}
        </div>
      </AdminSurface>
    </aside>
  )
}
