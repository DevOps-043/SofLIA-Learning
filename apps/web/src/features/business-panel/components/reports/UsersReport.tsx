'use client'

import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { StatCard } from './StatCard'
import { ChartCard } from './ChartCard'
import { Users, TrendingUp, Award } from 'lucide-react'
import { ReportTable } from '../ReportTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { UsersReportData } from './types'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

type UsersTooltipProps = {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number | string
  }>
}

type UserRow = NonNullable<UsersReportData['users']>[number]

function UsersReport({ data }: { data: UsersReportData }) {
  const { t } = useTranslation('business')
  const panelTheme = useBusinessPanelTheme()

  const chartColors = [
    panelTheme.actionColor,
    panelTheme.brandColor,
    panelTheme.successColor,
    panelTheme.warningColor,
    panelTheme.secondaryColor,
    ...panelTheme.chartColors,
  ]

  const roleData = Object.entries(data.summary?.by_job_title || {}).map(([name, value]) => ({
    name: name || t('reports.messages.unspecified'),
    value: value as number
  }))

  const statusData = Object.entries(data.summary?.by_status || {}).map(([name, value]) => ({
    name: name === 'active'
      ? t('reports.status.actives')
      : name === 'invited'
        ? t('reports.status.invitedPlural')
        : name === 'suspended'
          ? t('reports.status.suspendedPlural')
          : name,
    value: value as number
  }))

  const CustomPieTooltip = ({ active, payload }: UsersTooltipProps) => {
    const tooltipData = payload?.[0]
    if (active && tooltipData) {
      return (
        <div
          style={{
            backgroundColor: panelTheme.panelBg,
            border: `1px solid ${panelTheme.borderColor}`,
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontSize: '12px'
          }}
        >
          <p style={{ color: panelTheme.textColor, margin: 0, fontWeight: 600 }}>
            {tooltipData.name || 'Valor'}
          </p>
          <p style={{ color: panelTheme.textColor, margin: '4px 0 0 0', fontWeight: 500 }}>
            {typeof tooltipData.value === 'number'
              ? tooltipData.value % 1 === 0
                ? tooltipData.value
                : tooltipData.value.toFixed(1)
              : tooltipData.value}
          </p>
        </div>
      )
    }
    return null
  }

  const columns: ColumnDef<UserRow>[] = [
    { accessorKey: 'username', header: t('reports.usersReport.columns.username') },
    { accessorKey: 'email', header: t('reports.usersReport.columns.email') },
    { accessorKey: 'display_name', header: t('reports.usersReport.columns.name') },
    {
      accessorKey: 'job_title',
      header: t('reports.usersReport.columns.role'),
      cell: (info) => (
        <span
          className="px-2 py-1 rounded-lg text-xs"
          style={{
            backgroundColor: panelTheme.actionSurface,
            color: panelTheme.actionColor,
          }}
        >
          {(info.getValue() as string) || t('reports.messages.unspecified')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('reports.usersReport.columns.status'),
      cell: (info) => {
        const status = info.getValue() as string
        const colors: Record<string, string> = {
          active: panelTheme.successColor,
          invited: panelTheme.warningColor,
          suspended: panelTheme.dangerColor,
        }
        return (
          <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${colors[status] || '#6b7280'}20`, color: colors[status] || '#6b7280' }}>
            {status === 'active'
              ? t('reports.status.active')
              : status === 'invited'
                ? t('reports.status.invited')
                : status === 'suspended'
                  ? t('reports.status.suspended')
                  : status}
          </span>
        )
      }
    },
    {
      accessorKey: 'joined_at',
      header: t('reports.usersReport.columns.joinedAt'),
      cell: (info) => (info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-')
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t('reports.usersReport.stats.totalUsers')} value={data.total_users || 0} icon={Users} color={panelTheme.actionColor} />
        <StatCard label={t('reports.usersReport.stats.activeUsers')} value={data.summary?.by_status?.active || 0} icon={TrendingUp} color={panelTheme.successColor} />
        <StatCard label={t('reports.usersReport.stats.differentRoles')} value={Object.keys(data.summary?.by_job_title || {}).length} icon={Award} color={panelTheme.brandColor} />
      </div>

      {(roleData.length > 0 || statusData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roleData.length > 0 && (
            <ChartCard title={t('reports.usersReport.charts.roleDistribution')}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {roleData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {statusData.length > 0 && (
            <ChartCard title={t('reports.usersReport.charts.statusDistribution')}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={panelTheme.borderColor} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: panelTheme.textColor, fontSize: 12 }} axisLine={{ stroke: panelTheme.borderColor }} />
                  <YAxis tick={{ fill: panelTheme.textColor, fontSize: 12 }} axisLine={{ stroke: panelTheme.borderColor }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: panelTheme.panelBg,
                      border: `1px solid ${panelTheme.borderColor}`,
                      borderRadius: '8px',
                      color: panelTheme.textColor
                    }}
                    labelStyle={{ color: panelTheme.textColor }}
                    cursor={{ fill: panelTheme.hoverBg }}
                  />
                  <Bar dataKey="value" fill={panelTheme.actionColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      <ReportTable data={data.users || []} columns={columns} />
    </div>
  )
}

export { UsersReport }
