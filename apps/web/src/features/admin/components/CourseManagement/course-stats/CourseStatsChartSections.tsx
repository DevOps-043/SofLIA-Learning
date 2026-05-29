'use client'

import { motion } from 'framer-motion'
import { LineChart as LineChartIcon, Target, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useCourseManagementContext } from '../CourseManagementContext'
import type { CourseProgressDistributionPoint } from '../types'

const PROGRESS_COLORS = [
  'var(--color-warning)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-primary)',
]

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-gray-800)',
  border: '1px solid var(--color-gray-500)',
  borderRadius: '8px',
  color: 'var(--color-bg-light)',
}

export function CourseStatsChartSections() {
  const { t } = useTranslation('admin')
  const {
    state: { chartData },
  } = useCourseManagementContext()

  const emptyTrendData = [
    { dia: t('workshops.editor.stats.charts.days.monShort'), inscripciones: 0, activos: 0 },
    { dia: t('workshops.editor.stats.charts.days.tueShort'), inscripciones: 0, activos: 0 },
    { dia: t('workshops.editor.stats.charts.days.wedShort'), inscripciones: 0, activos: 0 },
    { dia: t('workshops.editor.stats.charts.days.thuShort'), inscripciones: 0, activos: 0 },
    { dia: t('workshops.editor.stats.charts.days.friShort'), inscripciones: 0, activos: 0 },
    { dia: t('workshops.editor.stats.charts.days.satShort'), inscripciones: 0, activos: 0 },
    { dia: t('workshops.editor.stats.charts.days.sunShort'), inscripciones: 0, activos: 0 },
  ]
  const fallbackStatusData = [
    {
      mes: t('workshops.editor.stats.charts.emptyMonthLabel'),
      completados: 0,
      enProgreso: 0,
      noIniciados: 0,
    },
  ]
  const progressData = withProgressColors(chartData?.progress_distribution ?? [])
  const trendData = chartData?.enrollment_trend_7d?.length
    ? chartData.enrollment_trend_7d
    : emptyTrendData
  const studentStatusData = chartData?.student_status_by_month?.length
    ? chartData.student_status_by_month
    : fallbackStatusData

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-500/30 dark:bg-carbon-800"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-success">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary dark:text-white">
                {t('workshops.editor.stats.charts.progressDistributionTitle')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-white/60">
                {t('workshops.editor.stats.charts.progressDistributionDescription')}
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(((percent || 0) * 100)).toFixed(0)}%`}
                  outerRadius={80}
                  fill="var(--color-legacy-8884d8)"
                  dataKey="value"
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-500/30 dark:bg-carbon-800"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <LineChartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary dark:text-white">
                {t('workshops.editor.stats.charts.enrollmentTrendTitle')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-white/60">
                {t('workshops.editor.stats.charts.last7Days')}
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorInscripciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorActivos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" opacity={0.3} />
                <XAxis dataKey="dia" stroke="var(--color-gray-500)" tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }} />
                <YAxis stroke="var(--color-gray-500)" tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="inscripciones"
                  stroke="var(--color-primary)"
                  fillOpacity={1}
                  fill="url(#colorInscripciones)"
                  strokeWidth={2}
                  name={t('workshops.editor.stats.charts.enrollments')}
                />
                <Area
                  type="monotone"
                  dataKey="activos"
                  stroke="var(--color-accent)"
                  fillOpacity={1}
                  fill="url(#colorActivos)"
                  strokeWidth={2}
                  name={t('workshops.editor.stats.charts.activeStudents')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-500/30 dark:bg-carbon-800"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-warning to-success">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary dark:text-white">
              {t('workshops.editor.stats.charts.studentStatusTitle')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/60">
              {t('workshops.editor.stats.charts.studentStatusDescription')}
            </p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={studentStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" opacity={0.3} />
              <XAxis dataKey="mes" stroke="var(--color-gray-500)" tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }} />
              <YAxis stroke="var(--color-gray-500)" tick={{ fill: 'var(--color-gray-500)', fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="completados"
                stroke="var(--color-success)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-success)', r: 5 }}
                activeDot={{ r: 7 }}
                name={t('workshops.editor.stats.charts.completed')}
              />
              <Line
                type="monotone"
                dataKey="enProgreso"
                stroke="var(--color-accent)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-accent)', r: 5 }}
                activeDot={{ r: 7 }}
                name={t('workshops.editor.stats.charts.inProgress')}
              />
              <Line
                type="monotone"
                dataKey="noIniciados"
                stroke="var(--color-warning)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-warning)', r: 5 }}
                activeDot={{ r: 7 }}
                name={t('workshops.editor.stats.charts.notStarted')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </>
  )
}

function withProgressColors(progressData: CourseProgressDistributionPoint[]) {
  return progressData.map((entry, index) => ({
    ...entry,
    fill: PROGRESS_COLORS[index] ?? 'var(--color-gray-500)',
  }))
}
