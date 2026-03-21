'use client'

import { motion } from 'framer-motion'
import { Users, CheckCircle, Clock, Award, PieChart, BarChart3 } from 'lucide-react'
import { useOverviewStats } from '../../hooks/useUserStatsB2B'
import { BarChartComponent, PieChartComponent, EmptyState } from './charts'

export function OverviewTab() {
  const { data, isLoading, error } = useOverviewStats()

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
        <p className="text-red-400">Error al cargar datos de resumen</p>
      </div>
    )
  }

  const stats = data

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Usuarios Activos (30d)"
          value={stats?.activeUsers30d ?? 0}
          icon={Users}
          color="text-blue-500"
        />
        <StatCard
          label="Tasa de Finalización"
          value={`${stats?.completionRate ?? 0}%`}
          icon={CheckCircle}
          color="text-green-500"
        />
        <StatCard
          label="Horas de Estudio (mes)"
          value={stats?.studyHoursMonth ?? 0}
          icon={Clock}
          color="text-purple-500"
        />
        <StatCard
          label="Certificados (mes)"
          value={stats?.certificatesMonth ?? 0}
          icon={Award}
          color="text-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Usuarios por Organización" icon={PieChart}>
          {stats?.usersByOrganization && stats.usersByOrganization.length > 0 ? (
            <PieChartComponent data={stats.usersByOrganization} dataKey="count" nameKey="name" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Actividad Diaria (30d)" icon={BarChart3}>
          {stats?.dailyActivity && stats.dailyActivity.length > 0 ? (
            <BarChartComponent data={stats.dailyActivity} dataKey="count" nameKey="date" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Distribución de Progreso" icon={PieChart}>
          {stats?.progressDistribution && stats.progressDistribution.some(d => d.count > 0) ? (
            <PieChartComponent data={stats.progressDistribution} dataKey="count" nameKey="range" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Roles en Organizaciones" icon={PieChart}>
          {stats?.roleDistribution && stats.roleDistribution.length > 0 ? (
            <PieChartComponent data={stats.roleDistribution} dataKey="count" nameKey="role" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
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

function ChartCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
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
