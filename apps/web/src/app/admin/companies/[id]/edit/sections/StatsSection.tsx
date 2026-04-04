'use client'

import React from 'react'
import { ArrowPathIcon, AcademicCapIcon, ChartBarIcon, ExclamationTriangleIcon, UsersIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'
import { colors, SectionWrapper, Card } from './shared'

function StatsSection({ company }: { company: CompanyData }) {
    const [stats, setStats] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const { isDark } = useTheme() // Assuming useTheme() provides isDark

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/admin/companies/${company.id}/stats`)
                const data = await res.json()
                if (data.success) {
                    setStats(data.stats)
                }
            } catch (err) {
                console.error('Error fetching stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [company.id])

    if (loading) {
        return (
            <div className="py-20 text-center">
                <ArrowPathIcon className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: colors.accent }} />
                <p className="text-white/60">Calculando métricas en tiempo real...</p>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="py-20 text-center">
                <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-4" style={{ color: colors.error }} />
                <p className="text-white/60">No pudimos cargar las estadísticas</p>
            </div>
        )
    }

    const { overview, activityMonthly, courseProgress, teamDistribution } = stats

    const COLORS_CHART = [colors.accent, colors.purple, colors.blue, colors.success, colors.error, colors.warning]

    return (
        <SectionWrapper>
            {/* Cards de Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border bg-gray-50 dark:bg-[#0F1419] border-gray-100 dark:border-white/5"
                >
                    <p className="text-3xl font-black text-black dark:text-white">{overview.totalUsers}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-gray-500 dark:text-[#8899A6]">Usuarios Totales</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border bg-gray-50 dark:bg-[#0F1419] border-gray-100 dark:border-white/5"
                >
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black text-green-500">{overview.engagementRate}%</p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-gray-500 dark:text-[#8899A6]">Compromiso Semanal</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border bg-gray-50 dark:bg-[#0F1419] border-gray-100 dark:border-white/5"
                >
                    <p className="text-3xl font-black text-accent">{overview.assignedCourses}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-gray-500 dark:text-[#8899A6]">Cursos Adquiridos</p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border bg-gray-50 dark:bg-[#0F1419] border-gray-100 dark:border-white/5"
                >
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black text-purple-500">{overview.avgSatisfaction}</p>
                        <span className="text-sm font-bold text-gray-400 dark:opacity-40">/ 5</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-gray-500 dark:text-[#8899A6]">Satisfacción (LIA NPS)</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Actividad */}
                <Card
                    title="Engagement Temporal"
                    description="Evolución de horas de aprendizaje (últimos 6 meses)"
                    icon={ChartBarIcon}
                    iconColor={colors.blue}
                >
                    <div className="h-64 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityMonthly}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.blue} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={colors.blue} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: colors.grayMedium, fontSize: 10, fontWeight: 'bold' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: colors.grayMedium, fontSize: 10, fontWeight: 'bold' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1E2329' : '#FFFFFF',
                                        borderRadius: '16px',
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                        color: isDark ? '#FFFFFF' : '#1A1D21'
                                    }}
                                    itemStyle={{ color: colors.accent, fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    stroke={colors.blue}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorHours)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Distribución por Equipo */}
                <Card
                    title="Distribución por Equipos"
                    description="Participación según departamento o zona"
                    icon={UsersIcon}
                    iconColor={colors.success}
                >
                    <div className="h-64 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={teamDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {teamDistribution.map((entry, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1E2329' : '#FFFFFF',
                                        borderRadius: '16px',
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                        color: isDark ? '#FFFFFF' : '#1A1D21'
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-gray-500 dark:text-white/60 text-[10px] font-bold uppercase">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Cursos */}
                <Card 
                    title="Rendimiento por Curso" 
                    description="Promedio de progreso y graduación" 
                    icon={AcademicCapIcon} 
                    iconColor={colors.purple}
                >
                    <div className="space-y-6 mt-4">
                        {courseProgress.map((course: CourseProgress, idx: number) => (
                            <div key={course.id} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-white font-bold text-sm truncate">{course.title}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.grayMedium }}>
                                            {course.enrolledCount} alumnos · {course.completedCount} graduados
                                        </p>
                                    </div>
                                    <span className="text-sm font-black" style={{ color: colors.accent }}>{course.averageProgress}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${course.averageProgress}%` }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: idx % 2 === 0 ? colors.purple : colors.accent }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Métricas de Valor */}
                <Card 
                    title="Impacto del Aprendizaje" 
                    description="Métricas de calidad y constancia" 
                    icon={SparklesIcon} 
                    iconColor={colors.warning}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black text-blue-500">{overview.totalEnrolled}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-gray-500 dark:text-white/40">Total Alumnos</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black text-green-500">{overview.totalGraduated}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-gray-500 dark:text-white/40">Graduados</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black text-purple-500">{overview.activeInLast30Days}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-gray-500 dark:text-white/40">Activos (30d)</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black text-orange-500">{overview.averageCourseProgress}%</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-gray-500 dark:text-white/40">Progreso Prom.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 h-full">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black" style={{ color: colors.blue }}>{overview.totalSessions}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-white/40">Lecciones Completas</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black" style={{ color: colors.warning }}>{Math.round(overview.totalLearningHours / 24)}d</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-white/40">Tiempo Acumulado</p>
                        </div>
                        <div className="col-span-2 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white/60">Salud del Ecosistema</p>
                                    <p className="text-xs font-bold mt-1">Nivel de compromiso: <span style={{ color: overview.engagementRate > 30 ? colors.success : colors.warning }}>{overview.engagementRate > 60 ? 'Excepcional' : overview.engagementRate > 30 ? 'Saludable' : 'En riesgo'}</span></p>
                                </div>
                                <SparklesIcon className="h-8 w-8 opacity-20" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </SectionWrapper>
    )
}

// ============================================
// CUSTOMIZATION SECTION
// ============================================

export { StatsSection }
