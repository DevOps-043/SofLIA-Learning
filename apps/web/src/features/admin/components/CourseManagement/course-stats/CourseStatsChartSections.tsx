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
  backgroundColor: '#1E2329',
  border: '1px solid #6C757D',
  borderRadius: '8px',
  color: '#fff',
}

export function CourseStatsChartSections() {
  const {
    state: { chartData, userStats },
  } = useCourseManagementContext()

  const progressData = [
    { name: '0-25%', value: userStats?.not_started ?? 0, fill: '#F59E0B' },
    {
      name: '26-50%',
      value: Math.floor((userStats?.in_progress ?? 0) * 0.3),
      fill: '#00D4B3',
    },
    {
      name: '51-75%',
      value: Math.floor((userStats?.in_progress ?? 0) * 0.4),
      fill: '#10B981',
    },
    {
      name: '76-100%',
      value: (userStats?.completed ?? 0) + Math.floor((userStats?.in_progress ?? 0) * 0.3),
      fill: '#0A2540',
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4B3] to-[#10B981]">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">
                Distribucion de Progreso
              </h3>
              <p className="text-xs text-[#6C757D] dark:text-white/60">
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
                  fill="#8884d8"
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
          className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0A2540] to-[#00D4B3]">
              <LineChartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">
                Tendencia de Inscripciones
              </h3>
              <p className="text-xs text-[#6C757D] dark:text-white/60">Ultimos 7 dias</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="colorInscripciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A2540" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0A2540" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorActivos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4B3" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00D4B3" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                <XAxis dataKey="dia" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 12 }} />
                <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="inscripciones"
                  stroke="#0A2540"
                  fillOpacity={1}
                  fill="url(#colorInscripciones)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="activos"
                  stroke="#00D4B3"
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
        className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#10B981]">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">
              Estado de Estudiantes
            </h3>
            <p className="text-xs text-[#6C757D] dark:text-white/60">
              Evolucion del progreso en el tiempo
            </p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData?.student_status_by_month || FALLBACK_STATUS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
              <XAxis dataKey="mes" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 12 }} />
              <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="completados"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
                activeDot={{ r: 7 }}
                name="Completados"
              />
              <Line
                type="monotone"
                dataKey="enProgreso"
                stroke="#00D4B3"
                strokeWidth={3}
                dot={{ fill: '#00D4B3', r: 5 }}
                activeDot={{ r: 7 }}
                name="En Progreso"
              />
              <Line
                type="monotone"
                dataKey="noIniciados"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', r: 5 }}
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
