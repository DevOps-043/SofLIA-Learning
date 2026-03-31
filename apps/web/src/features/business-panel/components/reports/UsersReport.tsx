'use client'

import { motion } from 'framer-motion'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'
import { StatCard } from './StatCard'
import { ChartCard } from './ChartCard'
import { Users, Activity, Award } from 'lucide-react'
import type { UsersReportData } from './types'

function UsersReport({ data }: { data: UsersReportData }) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : '#E2E8F0'
  
  const CHART_COLORS = [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

  const roleData = Object.entries(data.summary?.by_job_title || {}).map(([name, value]) => ({
    name: name || t('reports.messages.unspecified'),
    value: value as number
  }))

  const statusData = Object.entries(data.summary?.by_status || {}).map(([name, value]) => ({
    name: name === 'active' ? t('reports.status.actives') : name === 'invited' ? t('reports.status.invitedPlural') : name === 'suspended' ? t('reports.status.suspendedPlural') : name,
    value: value as number
  }))

  // CustomTooltip para gráficos de pastel
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
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
            {data.name || 'Valor'}
          </p>
          <p style={{ color: textColor, margin: '4px 0 0 0', fontWeight: 500 }}>
            {typeof data.value === 'number' 
              ? data.value % 1 === 0 
                ? data.value 
                : data.value.toFixed(1)
              : data.value}
          </p>
        </div>
      )
    }
    return null
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'username', header: t('reports.usersReport.columns.username') },
    { accessorKey: 'email', header: t('reports.usersReport.columns.email') },
    { accessorKey: 'display_name', header: t('reports.usersReport.columns.name') },
    { accessorKey: 'job_title', header: t('reports.usersReport.columns.role'), cell: (info) => (
      <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
        {(info.getValue() as string) || t('reports.messages.unspecified')}
      </span>
    )},
    { accessorKey: 'status', header: t('reports.usersReport.columns.status'), cell: (info) => {
      const status = info.getValue() as string
      const colors: Record<string, string> = { active: '#10b981', invited: '#f59e0b', suspended: '#ef4444' }
      return (
        <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${colors[status] || '#6b7280'}20`, color: colors[status] || '#6b7280' }}>
          {status === 'active' ? t('reports.status.active') : status === 'invited' ? t('reports.status.invited') : status === 'suspended' ? t('reports.status.suspended') : status}
        </span>
      )
    }},
    { accessorKey: 'joined_at', header: t('reports.usersReport.columns.joinedAt'), cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' }
  ]

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t('reports.usersReport.stats.totalUsers')} value={data.total_users || 0} icon={Users} color={accentColor} />
        <StatCard label={t('reports.usersReport.stats.activeUsers')} value={data.summary?.by_status?.active || 0} icon={TrendingUp} color="#10b981" />
        <StatCard label={t('reports.usersReport.stats.differentRoles')} value={Object.keys(data.summary?.by_job_title || {}).length} icon={Award} color="#8b5cf6" />
      </div>

      {/* Gráficos */}
      {(roleData.length > 0 || statusData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roleData.length > 0 && (
            <ChartCard title={t('reports.usersReport.charts.roleDistribution')}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: cardBg, 
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '8px',
                      color: textColor
                    }}
                    labelStyle={{ color: textColor }}
                    cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" fill={accentColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Tabla */}
      <ReportTable data={data.users || []} columns={columns} />
    </div>
  )
}

export { UsersReport }
