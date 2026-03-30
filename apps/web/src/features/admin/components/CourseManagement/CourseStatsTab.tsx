'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Users2, Star, Sigma, LineChart as LineChartIcon, ListChecks, Eye, TrendingUp, Target, Award, Clock, Rocket } from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import type { useCourseManagementLogic } from './hooks/useCourseManagementLogic'

type CourseManagementState = ReturnType<typeof useCourseManagementLogic>

interface CourseStatsTabProps extends CourseManagementState {}

export function CourseStatsTab(props: CourseStatsTabProps) {
  const {
    userStats, statsLoading, chartData,
    enrolledUsers,
    selectedStudent, setSelectedStudent,
    studentDetailsData, setStudentDetailsData,
    loadingStudentDetails, loadStudentDetails,
    setShowStudentDetailsModal,
  } = props

  return (
    <motion.div
      key="stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {statsLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mb-4"
          />
          <p className="text-[#6C757D] dark:text-white/60 text-sm font-medium">Cargando estadísticas...</p>
        </div>
      ) : (
        <>
          {/* KPIs Principales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Métricas Clave</h2>
                <p className="text-sm text-[#6C757D] dark:text-white/60">Indicadores principales de rendimiento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Users2,
                  label: 'Estudiantes Inscritos',
                  value: userStats?.total_enrolled ?? 0,
                  change: '+12%',
                  changeType: 'positive',
                  color: 'from-[#0A2540] to-[#00D4B3]'
                },
                {
                  icon: TrendingUp,
                  label: 'Tasa de Finalización',
                  value: userStats?.completion_rate ? `${userStats.completion_rate.toFixed(1)}%` : '0%',
                  change: '+5.2%',
                  changeType: 'positive',
                  color: 'from-[#10B981] to-[#00D4B3]'
                },
                {
                  icon: Target,
                  label: 'Progreso Promedio',
                  value: userStats ? `${Math.round(userStats.average_progress)}%` : '0%',
                  change: '+8.1%',
                  changeType: 'positive',
                  color: 'from-[#00D4B3] to-[#10B981]'
                },
                {
                  icon: Star,
                  label: 'Calificación',
                  value: userStats?.average_rating ? userStats.average_rating.toFixed(1) : '0.0',
                  change: userStats?.total_reviews ? `${userStats.total_reviews} reseñas` : 'Sin reseñas',
                  changeType: 'neutral',
                  color: 'from-[#F59E0B] to-[#10B981]'
                }
              ].map((kpi, index) => {
                const IconComponent = kpi.icon
                return (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          {kpi.changeType !== 'neutral' && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.changeType === 'positive'
                              ? 'bg-[#10B981]/10 text-[#10B981]'
                              : 'bg-red-500/10 text-red-500'
                              }`}>
                              {kpi.change}
                            </span>
                          )}
                        </div>
                        <div className="text-3xl font-bold text-[#0A2540] dark:text-white mb-1">
                          {kpi.value}
                        </div>
                        <div className="text-xs font-medium text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                          {kpi.label}
                        </div>
                        {kpi.changeType === 'neutral' && (
                          <div className="text-xs text-[#6C757D] dark:text-white/60 mt-2">
                            {kpi.change}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Gráficas Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica de Progreso de Estudiantes */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4B3] to-[#10B981] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Distribución de Progreso</h3>
                  <p className="text-xs text-[#6C757D] dark:text-white/60">Estado actual de los estudiantes</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '0-25%', value: userStats?.not_started ?? 0, fill: '#F59E0B' },
                        { name: '26-50%', value: Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#00D4B3' },
                        { name: '51-75%', value: Math.floor((userStats?.in_progress ?? 0) * 0.4), fill: '#10B981' },
                        { name: '76-100%', value: (userStats?.completed ?? 0) + Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#0A2540' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: '0-25%', value: userStats?.not_started ?? 0, fill: '#F59E0B' },
                        { name: '26-50%', value: Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#00D4B3' },
                        { name: '51-75%', value: Math.floor((userStats?.in_progress ?? 0) * 0.4), fill: '#10B981' },
                        { name: '76-100%', value: (userStats?.completed ?? 0) + Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#0A2540' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E2329',
                        border: '1px solid #6C757D',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Gráfica de Actividad en el Tiempo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                  <LineChartIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Tendencia de Inscripciones</h3>
                  <p className="text-xs text-[#6C757D] dark:text-white/60">Últimos 7 días</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { dia: 'Lun', inscripciones: 12, activos: 45 },
                    { dia: 'Mar', inscripciones: 19, activos: 52 },
                    { dia: 'Mié', inscripciones: 15, activos: 48 },
                    { dia: 'Jue', inscripciones: 22, activos: 61 },
                    { dia: 'Vie', inscripciones: 28, activos: 58 },
                    { dia: 'Sáb', inscripciones: 18, activos: 42 },
                    { dia: 'Dom', inscripciones: 14, activos: 38 }
                  ]}>
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
                    <XAxis
                      dataKey="dia"
                      stroke="#6C757D"
                      tick={{ fill: '#6C757D', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#6C757D"
                      tick={{ fill: '#6C757D', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E2329',
                        border: '1px solid #6C757D',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
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

          {/* Estadísticas Detalladas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#00D4B3] flex items-center justify-center">
                <Sigma className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Análisis Detallado</h2>
                <p className="text-sm text-[#6C757D] dark:text-white/60">Métricas avanzadas del curso</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Módulos Publicados', value: modules.filter((m: any) => m.is_published).length, total: modules.length, icon: Book, color: '#0A2540' },
                { label: 'Lecciones Totales', value: userStats?.total_lessons ?? 0, icon: FileText, color: '#00D4B3' },
                { label: 'Duración Total', value: formatDuration(modules.reduce((acc: number, m: any) => acc + (m.module_duration_minutes || 0), 0)), icon: Clock, color: '#10B981' },
                { label: 'Materiales', value: userStats?.total_materials ?? 0, icon: ClipboardList, color: '#F59E0B' },
                { label: 'Actividades', value: userStats?.total_activities ?? 0, icon: Flag, color: '#0A2540' },
                { label: 'Tasa de Retención', value: userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '0%', icon: Users2, color: '#10B981' },
                { label: 'Activos 7 días', value: userStats?.active_7d ?? 0, icon: TrendingUp, color: '#00D4B3' },
                { label: 'Activos 30 días', value: userStats?.active_30d ?? 0, icon: BarChart3, color: '#0A2540' },
                { label: 'Certificados Emitidos', value: userStats?.total_certificates ?? 0, icon: Award, color: '#F59E0B' }
              ].map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <IconComponent className="w-5 h-5" style={{ color: stat.color }} />
                      </div>
                      <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                        {stat.label}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#0A2540] dark:text-white">
                      {stat.value}
                      {stat.total && (
                        <span className="text-sm font-normal text-[#6C757D] dark:text-white/60 ml-2">
                          / {stat.total}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Gráfica de Estado de Estudiantes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#10B981] flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Estado de Estudiantes</h3>
                <p className="text-xs text-[#6C757D] dark:text-white/60">Evolución del progreso en el tiempo</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData?.student_status_by_month || [
                  { mes: 'Nov', completados: 0, enProgreso: 0, noIniciados: 0 }
                ]}>
                  <defs>
                    <linearGradient id="colorCompletados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEnProgreso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4B3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4B3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNoIniciados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                  <XAxis
                    dataKey="mes"
                    stroke="#6C757D"
                    tick={{ fill: '#6C757D', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6C757D"
                    tick={{ fill: '#6C757D', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E2329',
                      border: '1px solid #6C757D',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
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

          {/* Lista de Usuarios Inscritos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                <ListChecks className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Estudiantes Inscritos</h2>
                <p className="text-sm text-[#6C757D] dark:text-white/60">{enrolledUsers.length} estudiantes en total</p>
              </div>
            </div>

            {enrolledUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E2329] rounded-2xl border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A2540]/10 to-[#00D4B3]/10 dark:from-[#0A2540]/20 dark:to-[#00D4B3]/20 flex items-center justify-center mb-6">
                  <Users2 className="w-10 h-10 text-[#6C757D] dark:text-white/40" />
                </div>
                <p className="text-[#0A2540] dark:text-white text-lg font-semibold mb-2">No hay estudiantes inscritos</p>
                <p className="text-[#6C757D] dark:text-white/60 text-sm">Los estudiantes aparecerán aquí cuando se inscriban al curso</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Estudiante</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Progreso</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Inscrito</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Última Actividad</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                      {enrolledUsers.map((user: any) => (
                        <motion.tr
                          key={user.enrollment_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ backgroundColor: 'rgba(0, 212, 179, 0.05)' }}
                          className="transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.profile_picture ? (
                                <img src={user.profile_picture} alt={user.display_name} className="w-10 h-10 rounded-full border-2 border-[#00D4B3]" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white font-bold text-sm">
                                  {user.display_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-[#0A2540] dark:text-white">{user.display_name}</div>
                                <div className="text-xs text-[#6C757D] dark:text-white/60">{user.email || user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${user.enrollment_status === 'completed' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' :
                              user.enrollment_status === 'active' ? 'bg-[#00D4B3]/10 text-[#00D4B3] border border-[#00D4B3]/30' :
                                'bg-[#6C757D]/10 text-[#6C757D] border border-[#6C757D]/30'
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${user.enrollment_status === 'completed' ? 'bg-[#10B981]' :
                                user.enrollment_status === 'active' ? 'bg-[#00D4B3] animate-pulse' :
                                  'bg-[#6C757D]'
                                }`} />
                              {user.enrollment_status === 'completed' ? 'Completado' :
                                user.enrollment_status === 'active' ? 'Activo' :
                                  user.enrollment_status === 'paused' ? 'Pausado' :
                                    user.enrollment_status === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-full h-2.5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${user.progress_percentage}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-[#0A2540] to-[#00D4B3] rounded-full"
                                />
                              </div>
                              <span className="text-sm font-bold text-[#0A2540] dark:text-white min-w-[3rem] text-right">
                                {Math.round(user.progress_percentage)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#6C757D] dark:text-white/70">
                            {user.enrolled_at ? new Date(user.enrolled_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'â€”'}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#6C757D] dark:text-white/70">
                            {user.last_accessed_at ? new Date(user.last_accessed_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Nunca'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <motion.button
                                onClick={async () => {
                                  setSelectedStudent(user)
                                  setShowStudentDetailsModal(true)
                                  await loadStudentDetails(user.user_id)
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-1.5 bg-gradient-to-r from-[#0A2540] to-[#00D4B3] hover:from-[#0d2f4d] hover:to-[#00D4B3] text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver Detalles
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
