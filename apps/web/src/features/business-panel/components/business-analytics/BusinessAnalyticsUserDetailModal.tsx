'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Calendar, Clock, Target, X, Zap } from 'lucide-react'
import { buildBusinessAnalyticsActivityWeeks } from '../../services/business-analytics-display.service'
import { useUserDetailModalLogic } from '../../hooks/useBusinessAnalyticsLogic'
import { BusinessAnalyticsUserAvatar } from './shared'
import type { BusinessAnalyticsUserDetailModalProps } from './types'

export function BusinessAnalyticsUserDetailModal({
  user,
  onClose,
  theme,
}: BusinessAnalyticsUserDetailModalProps) {
  const {
    t,
    subTab,
    setSubTab,
    displayName,
    initials,
    getHeatmapColor,
    maxHour,
  } = useUserDetailModalLogic(user)

  const activityWeeks = buildBusinessAnalyticsActivityWeeks(user.stats?.activity_calendar)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(event) => event.stopPropagation()}
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl bg-white dark:bg-[#0f172a] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-50"
        style={{
          ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}),
        }}
      >
        <div className="relative shrink-0 bg-gray-100 dark:bg-gray-800 p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 pointer-events-none" />
          <div className="relative z-10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 transition-colors rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>

            <div className="flex items-start gap-5">
              <BusinessAnalyticsUserAvatar
                imageUrl={user.profile_picture_url}
                alt={user.name || t('analytics.usersTable.userDefault')}
                initials={initials}
                size="lg"
                borderColor={theme.cardBg}
              />
              <div className="flex-1 pt-1">
                <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                  {displayName}
                </h2>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
                  <span className="capitalize text-gray-600 dark:text-gray-300">
                    {user.role || t('analytics.usersTable.userDefault')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-black/30 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm">
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-gray-700 dark:text-white">
                    {t('analytics.userDetail.streak')}
                  </p>
                  <p className="font-bold text-sm leading-none text-gray-900 dark:text-white">
                    {user.stats?.current_streak || 0} {t('analytics.userDetail.days')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-black/30 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm">
                <Target className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-gray-700 dark:text-white">
                    {t('analytics.userDetail.adherence')}
                  </p>
                  <p className="font-bold text-sm leading-none text-gray-900 dark:text-white">
                    {user.stats?.planner?.adherence || 0}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-black/30 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm">
                <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-gray-700 dark:text-white">
                    {t('analytics.userDetail.totalTime')}
                  </p>
                  <p className="font-bold text-sm leading-none text-gray-900 dark:text-white">
                    {Math.round((user.total_time_minutes || 0) / 60)}h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex gap-6 mb-8 border-b" style={{ borderColor: theme.cardBorder }}>
            {(['activity', 'planner', 'courses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`pb-4 text-sm font-medium transition-all relative ${subTab === tab ? 'text-blue-500 dark:text-blue-400 opacity-100' : 'text-gray-500 dark:text-gray-400 opacity-60 hover:opacity-100'}`}
              >
                <span className="capitalize">
                  {tab === 'activity'
                    ? t('analytics.userDetail.tabs.activity')
                    : tab === 'planner'
                      ? t('analytics.userDetail.tabs.planner')
                      : t('analytics.userDetail.tabs.courses')}
                </span>
                {subTab === tab && (
                  <motion.div
                    layoutId="modalTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-500"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {subTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div
                  className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      {t('analytics.userDetail.history')}
                      <span className="ml-2 text-xs font-normal opacity-50">
                        {t('analytics.userDetail.last6Months')}
                      </span>
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex flex-col justify-between h-[88px] gap-1 pt-6 text-[9px] font-mono leading-3 opacity-40">
                      <span>Pos</span>
                      <span>Lun</span>
                      <span>Mié</span>
                      <span>Vie</span>
                    </div>

                    <div className="flex-1 pb-2 overflow-x-auto">
                      <div className="flex gap-1 min-w-max">
                        {activityWeeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col gap-1">
                            {week.map((day, dayIndex) => (
                              <div
                                key={`${day.date}-${dayIndex}`}
                                className={`w-3 h-3 rounded-sm text-[0px] ${day.isFuture ? 'invisible' : getHeatmapColor(day.level)}`}
                                title={`${new Date(day.date).toLocaleDateString()}: ${day.count} minutos`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 text-xs opacity-40">
                    <span>{t('analytics.userDetail.less')}</span>
                    <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-white/5" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span>{t('analytics.userDetail.more')}</span>
                  </div>
                </div>

                <div
                  className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}
                >
                  <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                    <Clock className="w-5 h-5 text-purple-400" />
                    Horarios de Estudio Preferidos
                  </h3>
                  <div className="flex items-end h-32 gap-1">
                    {user.stats?.hourly_distribution?.map((count, hour) => (
                      <div key={hour} className="flex flex-col items-center flex-1 gap-1 group">
                        <div
                          className="relative w-full rounded-t-sm bg-purple-500/30 hover:bg-purple-500 transition-colors"
                          style={{
                            height: `${maxHour > 0 ? (count / maxHour) * 100 : 0}%`,
                            minHeight: '4px',
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {count} sesiones
                          </div>
                        </div>
                        <span className="text-[9px] opacity-30">{hour}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {subTab === 'planner' && (
              <motion.div
                key="planner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-4"
              >
                <div
                  className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center"
                  style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}
                >
                  <div className="w-32 h-32 rounded-full border-8 border-white/5 flex items-center justify-center relative mb-4">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        strokeWidth="8"
                        stroke={theme.accentColor}
                        strokeDasharray="351"
                        strokeDashoffset={
                          351 - (351 * (user.stats?.planner?.adherence || 0)) / 100
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div>
                      <span className="text-3xl font-bold">
                        {user.stats?.planner?.adherence || 0}%
                      </span>
                    </div>
                  </div>
                  <p className="font-medium">Tasa de Adherencia</p>
                  <p className="text-xs opacity-50">Sesiones completadas vs planificadas</p>
                </div>
                <div
                  className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}
                >
                  <h3 className="font-semibold mb-4">Resumen de Sesiones</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Total Planificadas</span>
                      <span className="font-bold text-lg">
                        {user.stats?.planner?.total_sessions ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Completadas</span>
                      <span className="font-bold text-lg text-emerald-400">
                        {user.stats?.planner?.completed ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">Pendientes</span>
                      <span className="font-bold text-lg text-amber-400">
                        {user.stats?.planner?.pending ?? 0}
                      </span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="opacity-70">Tasa de Cumplimiento</span>
                        <span className="font-bold text-lg text-blue-400">
                          {user.stats?.planner?.adherence ?? 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {subTab === 'courses' && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-3xl font-bold text-blue-400">
                      {Math.round((user.stats?.courses?.total_lesson_time_minutes || 0) / 60)}h
                    </p>
                    <p className="text-xs opacity-50 mt-1">Tiempo Total</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-3xl font-bold text-emerald-400">
                      {user.stats?.courses?.lessons_completed || 0}
                    </p>
                    <p className="text-xs opacity-50 mt-1">Lecciones</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-3xl font-bold text-purple-400">
                      {user.stats?.courses?.quizzes_passed || 0}/
                      {user.stats?.courses?.quizzes_completed || 0}
                    </p>
                    <p className="text-xs opacity-50 mt-1">Quizzes Aprobados</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-3xl font-bold text-amber-400">
                      {user.stats?.courses?.notes_count || 0}
                    </p>
                    <p className="text-xs opacity-50 mt-1">Notas Creadas</p>
                  </div>
                </div>

                <div
                  className="p-5 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    Desglose por Curso
                  </h3>

                  {user.stats?.courses?.breakdown?.length > 0 ? (
                    <div className="space-y-4">
                      {user.stats.courses.breakdown.map((course, index) => (
                        <div key={`${course.course_id}-${index}`} className="p-3 rounded-lg bg-black/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm truncate flex-1 mr-4">
                              {course.course_title}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${course.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : course.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}
                            >
                              {course.status === 'completed'
                                ? 'Completado'
                                : course.status === 'active'
                                  ? 'En Progreso'
                                  : 'Inscrito'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${course.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-12 text-right">
                              {Math.round(course.progress || 0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 opacity-50">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay cursos inscritos</p>
                    </div>
                  )}
                </div>

                <div
                  className="p-5 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    Interacciones con LIA
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-black/20 text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        {user.stats?.lia?.total_conversations || 0}
                      </p>
                      <p className="text-xs opacity-50">Conversaciones</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/20 text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {user.stats?.lia?.total_messages || 0}
                      </p>
                      <p className="text-xs opacity-50">Mensajes Totales</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/20 text-center">
                      <p className="text-2xl font-bold text-amber-400">
                        {user.stats?.lia?.user_messages || 0}
                      </p>
                      <p className="text-xs opacity-50">Preguntas del Usuario</p>
                    </div>
                    <div className="p-3 rounded-lg bg-black/20 text-center">
                      <p className="text-2xl font-bold text-emerald-400">
                        {user.stats?.lia?.assistant_responses || 0}
                      </p>
                      <p className="text-xs opacity-50">Respuestas de LIA</p>
                    </div>
                  </div>

                  {(user.stats?.lia?.contexts?.ai_chat > 0 ||
                    user.stats?.lia?.contexts?.course > 0) && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs opacity-50 mb-2">Contextos de uso:</p>
                      <div className="flex gap-2">
                        {user.stats?.lia?.contexts?.ai_chat > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                            Chat General: {user.stats.lia.contexts.ai_chat}
                          </span>
                        )}
                        {user.stats?.lia?.contexts?.course > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                            En Cursos: {user.stats.lia.contexts.course}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
