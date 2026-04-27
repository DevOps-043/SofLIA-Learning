'use client'

import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

import { AdminLinkButton, AdminMetricCard, AdminSectionHeader, AdminSurface } from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import type {
  AdminDashboardStatIconMap,
  AdminDashboardStatItem,
  AdminDashboardThemeColors,
} from './types'

const statIcons: AdminDashboardStatIconMap = {
  courses: BookOpenIcon,
  engagement: ChartBarIcon,
  organizations: BuildingOffice2Icon,
  users: UsersIcon,
}

function AdminDashboardStatCard({ stat }: { stat: AdminDashboardStatItem }) {
  const theme = useAdminTheme()
  const isPositive = stat.change >= 0
  const Icon = statIcons[stat.iconKey]

  return (
    <Link href={stat.href}>
      <AdminMetricCard
        icon={Icon}
        label={stat.title}
        tone={stat.tone}
        value={typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
        description={
          <span
            className="inline-flex items-center gap-1"
            style={{ color: isPositive ? theme.action : theme.danger }}
          >
            {isPositive ? <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> : <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
            {isPositive ? '+' : ''}
            {stat.change}%
          </span>
        }
      />
    </Link>
  )
}

export function AdminDashboardStatsSection({
  error,
  isLoading,
  statsData,
}: {
  error: string | null
  isLoading: boolean
  statsData: AdminDashboardStatItem[]
  themeColors: AdminDashboardThemeColors
}) {
  const theme = useAdminTheme()

  return (
    <section>
      <AdminSectionHeader
        title="Estadisticas generales"
        description="Metricas clave de crecimiento, uso y actividad de la plataforma."
        actions={
          <AdminLinkButton href="/admin/reportes" variant="secondary" size="sm">Ver reportes</AdminLinkButton>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <AdminSurface key={index} className="h-32 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <AdminSurface className="p-5" style={{ backgroundColor: theme.dangerSurface, borderColor: theme.danger }}>
          <p className="text-sm font-medium" style={{ color: theme.danger }}>
            Error al cargar estadisticas: {error}
          </p>
        </AdminSurface>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statsData.map((stat) => (
            <AdminDashboardStatCard key={stat.title} stat={stat} />
          ))}
        </div>
      )}
    </section>
  )
}
