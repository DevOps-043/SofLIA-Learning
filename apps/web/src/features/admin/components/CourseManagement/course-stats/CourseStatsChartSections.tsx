'use client'

import { motion } from 'framer-motion'
import { BarChart3, LineChart as LineChartIcon, Target, TrendingUp } from 'lucide-react'
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

const TREND_DATA = [
  { dia: 'Lun', inscripciones: 12, activos: 45 },
  { dia: 'Mar', inscripciones: 19, activos: 52 },
  { dia: 'Mie', inscripciones: 15, activos: 48 },
  { dia: 'Jue', inscripciones: 22, activos: 61 },
  { dia: 'Vie', inscripciones: 28, activos: 58 },
  { dia: 'Sab', inscripciones: 18, activos: 42 },
  { dia: 'Dom', inscripciones: 14, activos: 38 },
]

const FALLBACK_STATUS_DATA = [{ mes: 'Nov', completados: 0, enProgreso: 0, noIniciados: 0 }]

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-gray-800)',
  border: '1px solid var(--color-gray-500)',
  borderRadius: '8px',
  color: 'var(--color-bg-light)',
}

export function CourseStatsChartSections() {
  const {
    state: { chartData, userStats },
  } = useCourseManagementContext()

  const progressData = [
    { name: '0-25%', value: userStats?.not_started ?? 0, fill: 'var(--color-warning)' },
    {
      name: '26-50%',
      value: Math.floor((userStats?.in_progress ?? 0) * 0.3),
      fill: 'var(--color-accent)',
    },
    {
      name: '51-75%',
      value: Math.floor((userStats?.in_progress ?? 0) * 0.4),
      fill: 'var(--color-success)',
    },
    {
      name: '76-100%',
      value: (userStats?.completed ?? 0) + Math.floor((userStats?.in_progress ?? 0) * 0.3),
      fill: 'var(--color-primary)',
    },
  ]

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
                Distribucion de Progreso
              </h3>
              <p className="text-xs text-gray-500 dark:text-white/60">
                Estado actual de los estudiantes
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
                Tendencia de Inscripciones
              </h3>
              <p className="text-xs text-gray-500 dark:text-white/60">Ultimos 7 dias</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
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
                />
                <Area
                  type="monotone"
                  dataKey="activos"
                  stroke="var(--color-accent)"
                  fillOpacity={1}
                  fill="url(#colorActivos)"
                  strokeWidth={2}
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
              Estado de Estudiantes
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/60">
              Evolucion del progreso en el tiempo
            </p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData?.student_status_by_month || FALLBACK_STATUS_DATA}>
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
                name="Completados"
              />
              <Line
                type="monotone"
                dataKey="enProgreso"
                stroke="var(--color-accent)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-accent)', r: 5 }}
                activeDot={{ r: 7 }}
                name="En Progreso"
              />
              <Line
                type="monotone"
                dataKey="noIniciados"
                stroke="var(--color-warning)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-warning)', r: 5 }}
                activeDot={{ r: 7 }}
                name="No Iniciados"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </>
  )
}
