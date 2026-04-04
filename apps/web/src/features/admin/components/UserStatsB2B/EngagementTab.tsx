'use client'

import { motion } from 'framer-motion'
import { UserCheck, RefreshCw, Star, UserX, BarChart3, PieChart, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEngagementStats } from '../../hooks/useUserStatsB2B'
import { BarChartComponent, GroupedBarChartComponent, EmptyState } from './charts'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'

export function EngagementTab() {
  const { data, isLoading, error } = useEngagementStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">Error al cargar datos de engagement</p>
      </div>
    )
  }

  const stats = data

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tasa de Activación"
          value={`${stats?.activationRate ?? 0}%`}
          icon={UserCheck}
          color="text-blue-500"
        />
        <StatCard
          label="Retorno Semanal"
          value={`${stats?.weeklyReturn ?? 0}%`}
          icon={RefreshCw}
          color="text-green-500"
        />
        <StatCard
          label="Satisfacción Promedio"
          value={`${stats?.avgSatisfaction ?? 0}/5`}
          icon={Star}
          color="text-yellow-500"
        />
        <StatCard
          label="Sin Actividad (30d)"
          value={stats?.inactiveUsers30d ?? 0}
          icon={UserX}
          color="text-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Nuevos vs Recurrentes (semanal)" icon={BarChart3}>
          {stats?.newVsRecurring && stats.newVsRecurring.length > 0 ? (
            <GroupedBarChartComponent
              data={stats.newVsRecurring}
              nameKey="week"
              keys={[
                { key: 'new', label: 'Nuevos', color: SOFLIA_ADMIN_COLORS.info },
                { key: 'recurring', label: 'Recurrentes', color: SOFLIA_ADMIN_COLORS.success },
              ]}
            />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Distribución de Calificaciones" icon={Star}>
          {stats?.ratingDistribution && stats.ratingDistribution.some(d => d.count > 0) ? (
            <BarChartComponent
              data={stats.ratingDistribution.map(d => ({ ...d, label: `${d.rating} estrella${d.rating > 1 ? 's' : ''}` }))}
              dataKey="count"
              nameKey="label"
            />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Engagement por Organización" icon={BarChart3}>
          {stats?.engagementByOrg && stats.engagementByOrg.length > 0 ? (
            <BarChartComponent data={stats.engagementByOrg} dataKey="ratio" nameKey="org" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Usuarios por País" icon={Globe}>
          {stats?.usersByCountry && stats.usersByCountry.length > 0 ? (
            <BarChartComponent data={stats.usersByCountry} dataKey="count" nameKey="country" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: LucideIcon; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </motion.div>
  )
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 min-h-[350px]"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </h3>
      {children}
    </motion.div>
  )
}
