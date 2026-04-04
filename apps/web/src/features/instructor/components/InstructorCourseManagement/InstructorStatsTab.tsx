import { LayoutDashboard, Users2, DollarSign, Star, Sigma, Briefcase, LineChart as LineChartIcon, ListChecks } from 'lucide-react'
import { EnrollmentTrendChart, ProgressDistributionChart, EngagementScatterChart, CompletionRateChart, DonutPieChart } from '../../../admin/components/AdvancedCharts'
import type { AdminModule } from '../../../admin/services/adminModules.service'
import type { InstructorStatsTabProps } from './types'

function hasValue(value: number | string | null | undefined): value is number | string {
  return value !== null && value !== undefined
}

function formatRoundedPercent(value: number | null | undefined): string | null {
  return hasValue(value) ? `${Math.round(value)}%` : null
}

function formatFixedPercent(value: number | null | undefined): string | null {
  return hasValue(value) ? `${value.toFixed(1)}%` : null
}

export function InstructorStatsTab({ modules, userStats, enrolledUsers, statsLoading, chartData }: InstructorStatsTabProps) {
  const hasFinancialStats = (userStats?.total_purchases ?? 0) > 0 || (userStats?.total_revenue_cents ?? 0) > 0
  const hasReviewStats = (userStats?.total_reviews ?? 0) > 0

  return (
    <div className="mt-6 space-y-6">
      {statsLoading ? (
        <div className="text-center py-20 text-purple-200">Cargando estadísticas...</div>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-purple-300" />
              Estadísticas del Curso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Módulos</div>
                <div className="text-3xl font-bold text-white">{modules.length}</div>
                <div className="text-xs text-purple-400/60 mt-1">{modules.filter((m: AdminModule) => m.is_published).length} publicados</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Lecciones</div>
                <div className="text-3xl font-bold text-white">{userStats?.total_lessons ?? '—'}</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Duración total</div>
                <div className="text-3xl font-bold text-white">{modules.reduce((acc: number, m: AdminModule) => acc + (m.module_duration_minutes || 0), 0)} min</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Materiales</div>
                <div className="text-3xl font-bold text-white">{userStats?.total_materials ?? '—'}</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Actividades</div>
                <div className="text-3xl font-bold text-white">{userStats?.total_activities ?? '—'}</div>
                <div className="text-xs text-purple-400/60 mt-1">{userStats?.completed_activities ?? 0} completadas</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Notas creadas</div>
                <div className="text-3xl font-bold text-white">{userStats?.total_notes ?? '—'}</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
              <Users2 className="w-5 h-5 text-purple-300" />
              Estadísticas de Usuarios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Usuarios inscritos', value: userStats?.total_enrolled },
                { label: 'En progreso', value: userStats?.in_progress },
                { label: 'Completados', value: userStats?.completed },
                { label: 'No iniciados', value: userStats?.not_started },
                { label: 'Progreso promedio', value: formatRoundedPercent(userStats?.average_progress) },
                { label: 'Activos últimos 7 días', value: userStats?.active_7d },
                { label: 'Activos últimos 30 días', value: userStats?.active_30d },
                { label: 'Certificados emitidos', value: userStats?.total_certificates },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-sm text-purple-300/80 mb-2">{label}</div>
                  <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {hasFinancialStats && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-300" />
                Estadísticas Financieras
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-sm text-purple-300/80 mb-2">Compras totales</div>
                  <div className="text-3xl font-bold text-white">{userStats?.total_purchases ?? '—'}</div>
                  <div className="text-xs text-purple-400/60 mt-1">{userStats?.active_purchases ?? 0} activas</div>
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-sm text-purple-300/80 mb-2">Ingresos totales</div>
                  <div className="text-3xl font-bold text-green-400">{userStats?.total_revenue_display ?? '$0.00'}</div>
                </div>
              </div>
            </div>
          )}

          {hasReviewStats && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-300" />
                Reseñas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-sm text-purple-300/80 mb-2">Total de reseñas</div>
                  <div className="text-3xl font-bold text-white">{userStats?.total_reviews ?? '—'}</div>
                </div>
                <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-sm text-purple-300/80 mb-2">Calificación promedio</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {userStats ? `${userStats.average_rating.toFixed(1)} ⭐` : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
              <Sigma className="w-5 h-5 text-purple-300" />
              Análisis Estadístico Profundo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Mediana de Progreso', value: formatRoundedPercent(userStats?.median_progress), sub: 'Valor central' },
                { label: 'Desviación Estándar', value: userStats?.std_deviation, sub: 'Dispersión de datos' },
                { label: 'Rango Intercuartílico', value: formatRoundedPercent(userStats?.iqr_progress), sub: 'Q3 - Q1' },
                {
                  label: 'Rango Total',
                  value: userStats ? `${Math.round(userStats.min_progress)}% - ${Math.round(userStats.max_progress)}%` : null,
                  sub: undefined,
                },
                { label: 'Primer Cuartil (Q1)', value: formatRoundedPercent(userStats?.q1_progress), sub: undefined },
                { label: 'Tercer Cuartil (Q3)', value: formatRoundedPercent(userStats?.q3_progress), sub: undefined },
                { label: 'Varianza', value: userStats?.variance, sub: undefined },
                {
                  label: 'Tiempo Promedio de Finalización',
                  value: hasValue(userStats?.avg_completion_days) ? `${Math.round(userStats.avg_completion_days)} días` : null,
                  sub: undefined,
                },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                  <div className="text-sm text-purple-300/80 mb-2">{label}</div>
                  <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
                  {sub && <div className="text-xs text-purple-400/60 mt-1">{sub}</div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-300" />
              Métricas de RRHH
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Tasa de Retención</div>
                <div className="text-3xl font-bold text-green-400">{formatFixedPercent(userStats?.retention_rate) ?? '—'}</div>
                <div className="text-xs text-purple-400/60 mt-1">Usuarios activos últimos 30 días</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Tasa de Finalización</div>
                <div className="text-3xl font-bold text-blue-400">{formatFixedPercent(userStats?.completion_rate) ?? '—'}</div>
                <div className="text-xs text-purple-400/60 mt-1">Completados / Inscritos</div>
              </div>
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 p-6">
                <div className="text-sm text-purple-300/80 mb-2">Tasa de Abandono</div>
                <div className="text-3xl font-bold text-red-400">
                  {hasValue(userStats?.retention_rate) ? `${(100 - userStats.retention_rate).toFixed(1)}%` : '—'}
                </div>
                <div className="text-xs text-purple-400/60 mt-1">Usuarios inactivos</div>
              </div>
            </div>
          </div>

          {chartData && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-purple-300" />
                Visualizaciones Avanzadas
              </h2>
              {chartData.enrollment_trend.length > 0 && <EnrollmentTrendChart data={chartData.enrollment_trend} />}
              {chartData.progress_distribution.length > 0 && <ProgressDistributionChart data={chartData.progress_distribution} />}
              {chartData.engagement_data.length > 0 && <EngagementScatterChart data={chartData.engagement_data} />}
              {chartData.enrollment_rates.length > 0 && <CompletionRateChart data={chartData.enrollment_rates} />}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartData.user_roles_pie.length > 0 && <DonutPieChart data={chartData.user_roles_pie} title="Distribución por Rol" />}
                {chartData.user_areas_pie.length > 0 && <DonutPieChart data={chartData.user_areas_pie} title="Distribución por Área" />}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-white mb-4 inline-flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-purple-300" />
              Lista de Usuarios Inscritos
            </h2>
            {enrolledUsers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-purple-800/40 rounded-xl text-purple-200">
                No hay usuarios inscritos aún
              </div>
            ) : (
              <div className="rounded-2xl border border-purple-800/30 bg-gray-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-900/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Usuario</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Estado</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Progreso</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Inscrito</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase">Última actividad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-800/30">
                      {enrolledUsers.map((enrolledUser) => {
                        const avatarInitial = enrolledUser.display_name.charAt(0).toUpperCase()
                        const progressPercentage = Math.max(0, Math.min(100, enrolledUser.progress_percentage))

                        return (
                          <tr key={enrolledUser.enrollment_id} className="hover:bg-purple-900/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {enrolledUser.profile_picture ? (
                                  <img src={enrolledUser.profile_picture} alt={enrolledUser.display_name} className="w-10 h-10 rounded-full" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-purple-700/40 flex items-center justify-center text-purple-200 font-semibold">
                                    {avatarInitial}
                                  </div>
                                )}
                                <div>
                                  <div className="text-white font-medium">{enrolledUser.display_name}</div>
                                  <div className="text-xs text-purple-300/70">{enrolledUser.email || enrolledUser.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                enrolledUser.enrollment_status === 'completed' ? 'bg-green-900/30 text-green-300 border border-green-700/40' :
                                enrolledUser.enrollment_status === 'active' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/40' :
                                'bg-gray-800/50 text-gray-300 border border-gray-700/40'
                              }`}>
                                {enrolledUser.enrollment_status === 'completed' ? 'Completado' :
                                  enrolledUser.enrollment_status === 'active' ? 'Activo' :
                                  enrolledUser.enrollment_status === 'paused' ? 'Pausado' :
                                  enrolledUser.enrollment_status === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-purple-900/30 rounded-full h-2 overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all" style={{ width: `${progressPercentage}%` }} />
                                </div>
                                <span className="text-sm text-purple-200 font-medium w-12 text-right">{Math.round(progressPercentage)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-purple-200">
                              {enrolledUser.enrolled_at ? new Date(enrolledUser.enrolled_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-purple-200">
                              {enrolledUser.last_accessed_at ? new Date(enrolledUser.last_accessed_at).toLocaleString() : 'Nunca'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
