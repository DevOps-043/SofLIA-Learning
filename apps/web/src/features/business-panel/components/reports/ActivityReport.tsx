'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'
import { StatCard } from './StatCard'
import { ChartCard } from './ChartCard'
import { Activity, Users, TrendingUp, Award } from 'lucide-react'
import { ReportTable } from '../ReportTable'
import type { ColumnDef } from '@tanstack/react-table'
import type { ActivityReportData } from './types'

type ActivityStatusDatum = {
  name: string
  value: number
}

type ActivityTooltipProps = {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number | string
  }>
}

type ActivityRow = NonNullable<ActivityReportData['activities']>[number]

function ActivityReport({ data }: { data: ActivityReportData }) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'

  const chartColors = [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  const statusData: ActivityStatusDatum[] = [
    { name: t('reports.status.actives'), value: data.active_count || 0 },
    { name: t('reports.status.completedPlural'), value: data.completed_count || 0 },
    { name: t('reports.status.inactives'), value: data.inactive_count || 0 }
  ].filter((item) => item.value > 0)

  const CustomPieTooltip = ({ active, payload }: ActivityTooltipProps) => {
    const tooltipData = payload?.[0]
    if (active && tooltipData) {
      return (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontSize: '12px'
          }}
        >
          <p style={{ color: textColor, margin: 0, fontWeight: 600 }}>
            {tooltipData.name || t('reports.messages.value')}
          </p>
          <p style={{ color: textColor, margin: '4px 0 0 0', fontWeight: 500 }}>
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

  const columns: ColumnDef<ActivityRow>[] = [
    { accessorKey: 'user_name', header: t('reports.activityReport.columns.user') },
    { accessorKey: 'course_title', header: t('reports.activityReport.columns.course') },
    {
      accessorKey: 'enrollment_status',
      header: t('reports.activityReport.columns.status'),
      cell: (info) => {
        const status = info.getValue() as string
        const colors: Record<string, string> = {
          active: '#10b981',
          completed: accentColor,
          inactive: '#6b7280'
        }
        return (
          <span
            className="px-2 py-1 rounded-lg text-xs"
            style={{ backgroundColor: `${colors[status] || '#6b7280'}20`, color: colors[status] || '#6b7280' }}
          >
            {status === 'active'
              ? t('reports.status.active')
              : status === 'completed'
                ? t('reports.status.completed')
                : t('reports.status.inactive')}
          </span>
        )
      }
    },
    {
      accessorKey: 'enrolled_at',
      header: t('reports.activityReport.columns.enrolledAt'),
      cell: (info) => (info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-')
    },
    {
      accessorKey: 'last_accessed_at',
      header: t('reports.activityReport.columns.lastAccess'),
      cell: (info) => (info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-')
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label={t('reports.activityReport.stats.totalActivities')} value={data.total_activities || 0} icon={Activity} color={accentColor} />
        <StatCard label={t('reports.activityReport.stats.users')} value={data.total_users || 0} icon={Users} color="#8b5cf6" />
        <StatCard label={t('reports.activityReport.stats.actives')} value={data.active_count || 0} icon={TrendingUp} color="#10b981" />
        <StatCard label={t('reports.activityReport.stats.completed')} value={data.completed_count || 0} icon={Award} color="#f59e0b" />
      </div>

      {statusData.length > 0 && (
        <ChartCard title={t('reports.activityReport.charts.status')}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {statusData.map((_, index) => (
                  <Cell key={index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend wrapperStyle={{ color: textColor }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ReportTable data={data.activities || []} columns={columns} />
    </div>
  )
}

export { ActivityReport }
