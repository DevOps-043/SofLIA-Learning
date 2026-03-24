'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle, Calendar, BarChart3, PieChart } from 'lucide-react'
import { useLearningStats } from '../../hooks/useUserStatsB2B'
import { BarChartComponent, PieChartComponent, GroupedBarChartComponent, EmptyState } from './charts'

export function LearningTab() {
  const { data, isLoading, error } = useLearningStats()

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
        <p className="text-red-400">Error al cargar datos de aprendizaje</p>
      </div>
    )
  }

  const stats = data

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Tiempo Promedio/Lección"
          value={`${stats?.avgTimePerLesson ?? 0} min`}
          icon={Clock}
          color="text-blue-500"
        />
        <StatCard
          label="Tasa de Aprobación Quiz"
          value={`${stats?.quizPassRate ?? 0}%`}
          icon={CheckCircle}
          color="text-green-500"
        />
        <StatCard
          label="Sesiones Prom./Usuario/Sem"
          value={stats?.avgSessionsPerWeek ?? 0}
          icon={Calendar}
          color="text-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top 10 Cursos por Tiempo de Estudio" icon={BarChart3}>
          {stats?.topCoursesByTime && stats.topCoursesByTime.length > 0 ? (
            <BarChartComponent data={stats.topCoursesByTime} dataKey="minutes" nameKey="course" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Sesiones: Planificadas vs Completadas" icon={BarChart3}>
          {stats?.sessionsPlannedVsCompleted && stats.sessionsPlannedVsCompleted.length > 0 ? (
            <GroupedBarChartComponent
              data={stats.sessionsPlannedVsCompleted}
              nameKey="week"
              keys={[
                { key: 'planned', label: 'Planificadas', color: '#3B82F6' },
                { key: 'completed', label: 'Completadas', color: '#10B981' },
              ]}
            />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Distribución de Tiempo por Contenido" icon={PieChart}>
          {stats?.timeByContentType && stats.timeByContentType.length > 0 ? (
            <PieChartComponent data={stats.timeByContentType} dataKey="minutes" nameKey="type" />
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Distribución de Rachas" icon={BarChart3}>
          {stats?.streakDistribution && stats.streakDistribution.some(d => d.count > 0) ? (
            <BarChartComponent data={stats.streakDistribution} dataKey="count" nameKey="range" />
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
