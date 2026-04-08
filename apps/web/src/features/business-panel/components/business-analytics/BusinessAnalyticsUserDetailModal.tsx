'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Calendar, Clock, Target, X, Zap } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { buildBusinessAnalyticsActivityWeeks } from '../../services/business-analytics-display.service'
import { useUserDetailModalLogic } from '../../hooks/useBusinessAnalyticsLogic'
import { BusinessAnalyticsUserAvatar } from './shared'
import type { BusinessAnalyticsUserDetailModalProps } from './types'

export function BusinessAnalyticsUserDetailModal({
  user,
  onClose,
}: BusinessAnalyticsUserDetailModalProps) {
  const panelTheme = useBusinessPanelTheme()
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

  const sectionStyle = {
    backgroundColor: panelTheme.cardBg,
    borderColor: panelTheme.borderColor,
  }

  const miniTileStyle = {
    backgroundColor: panelTheme.inputBg,
    borderColor: panelTheme.borderColor,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ backgroundColor: panelTheme.overlayBg }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(event) => event.stopPropagation()}
        className="relative flex flex-col w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2rem] border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
        style={{
          backgroundColor: panelTheme.panelBg,
          borderColor: panelTheme.borderColor,
          color: panelTheme.textColor,
        }}
      >
        <div className="relative shrink-0 p-6 pb-5 border-b" style={{ borderColor: panelTheme.dividerColor }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: panelTheme.heroBackground,
            }}
          />
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.9) 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          <div className="relative z-10">
            <button
              onClick={onClose}
              className="absolute top-0 right-0 z-10 p-3 rounded-2xl border transition-colors"
              style={{
                backgroundColor: panelTheme.inverseSurface,
                borderColor: panelTheme.inverseBorderColor,
                color: panelTheme.inverseTextColor,
              }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              <BusinessAnalyticsUserAvatar
                imageUrl={user.profile_picture_url}
                alt={user.name || t('analytics.usersTable.userDefault')}
                initials={initials}
                size="lg"
                borderColor={panelTheme.panelBg}
              />

              <div className="flex-1 min-w-0">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: panelTheme.inverseTextColor }}
                >
                  {displayName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className="px-3 py-1 rounded-xl border"
                    style={{
                      backgroundColor: panelTheme.inverseSurface,
                      borderColor: panelTheme.inverseBorderColor,
                      color: panelTheme.inverseSubtextColor,
                    }}
                  >
                    {user.email}
                  </span>
                  <span
                    className="px-3 py-1 rounded-xl border capitalize"
                    style={{
                      backgroundColor: `${panelTheme.accentColor}18`,
                      borderColor: `${panelTheme.accentColor}30`,
                      color: panelTheme.accentColor,
                    }}
                  >
                    {user.role || t('analytics.usersTable.userDefault')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
              <HeaderMetric
                icon={<Zap className="w-4 h-4" />}
                label={t('analytics.userDetail.streak')}
                value={`${user.stats?.current_streak || 0} ${t('analytics.userDetail.days')}`}
                color={panelTheme.warningColor}
              />
              <HeaderMetric
                icon={<Target className="w-4 h-4" />}
                label={t('analytics.userDetail.adherence')}
                value={`${user.stats?.planner?.adherence || 0}%`}
                color={panelTheme.successColor}
              />
              <HeaderMetric
                icon={<Clock className="w-4 h-4" />}
                label={t('analytics.userDetail.totalTime')}
                value={`${Math.round((user.total_time_minutes || 0) / 60)}h`}
                color={panelTheme.secondaryColor}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-wrap gap-2 mb-6">
            {(['activity', 'planner', 'courses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className="px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: subTab === tab ? panelTheme.primaryColor : panelTheme.inputBg,
                  border: `1px solid ${subTab === tab ? `${panelTheme.primaryColor}30` : panelTheme.borderColor}`,
                  color: subTab === tab ? panelTheme.onPrimaryColor : panelTheme.textColor,
                }}
              >
                {tab === 'activity'
                  ? t('analytics.userDetail.tabs.activity')
                  : tab === 'planner'
                    ? t('analytics.userDetail.tabs.planner')
                    : t('analytics.userDetail.tabs.courses')}
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
                <div className="p-6 rounded-3xl border" style={sectionStyle}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Calendar className="w-5 h-5" style={{ color: panelTheme.secondaryColor }} />
                      {t('analytics.userDetail.history')}
                      <span className="ml-2 text-xs font-normal" style={{ color: panelTheme.subtextColor }}>
                        {t('analytics.userDetail.last6Months')}
                      </span>
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <div
                      className="flex flex-col justify-between h-[88px] gap-1 pt-6 text-[9px] font-mono leading-3"
                      style={{ color: panelTheme.mutedTextColor }}
                    >
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

                  <div className="flex items-center justify-end gap-2 mt-4 text-xs" style={{ color: panelTheme.mutedTextColor }}>
                    <span>{t('analytics.userDetail.less')}</span>
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: panelTheme.hoverBg }} />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span>{t('analytics.userDetail.more')}</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl border" style={sectionStyle}>
                  <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                    <Clock className="w-5 h-5" style={{ color: panelTheme.secondaryColor }} />
                    Horarios de Estudio Preferidos
                  </h3>
                  <div className="flex items-end h-32 gap-1">
                    {user.stats?.hourly_distribution?.map((count, hour) => (
                      <div key={hour} className="flex flex-col items-center flex-1 gap-1 group">
                        <div
                          className="relative w-full rounded-t-sm transition-colors"
                          style={{
                            height: `${maxHour > 0 ? (count / maxHour) * 100 : 0}%`,
                            minHeight: '4px',
                            backgroundColor: `${panelTheme.secondaryColor}55`,
                          }}
                        >
                          <div
                            className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                            style={{
                              backgroundColor: panelTheme.panelBg,
                              border: `1px solid ${panelTheme.borderColor}`,
                              color: panelTheme.textColor,
                            }}
                          >
                            {count} sesiones
                          </div>
                        </div>
                        <span className="text-[9px]" style={{ color: panelTheme.mutedTextColor }}>
                          {hour}h
                        </span>
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
                className="grid grid-cols-1 xl:grid-cols-2 gap-4"
              >
                <div
                  className="p-6 rounded-3xl border flex flex-col items-center justify-center text-center"
                  style={sectionStyle}
                >
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center relative mb-4"
                    style={{ border: `8px solid ${panelTheme.hoverBg}` }}
                  >
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        strokeWidth="8"
                        stroke={panelTheme.accentColor}
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
                  <p className="text-xs" style={{ color: panelTheme.subtextColor }}>
                    Sesiones completadas vs planificadas
                  </p>
                </div>

                <div className="p-6 rounded-3xl border" style={sectionStyle}>
                  <h3 className="font-semibold mb-4">Resumen de Sesiones</h3>
                  <div className="space-y-3">
                    <PlannerRow label="Total Planificadas" value={user.stats?.planner?.total_sessions ?? 0} />
                    <PlannerRow label="Completadas" value={user.stats?.planner?.completed ?? 0} valueColor={panelTheme.successColor} />
                    <PlannerRow label="Pendientes" value={user.stats?.planner?.pending ?? 0} valueColor={panelTheme.warningColor} />
                    <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${panelTheme.dividerColor}` }}>
                      <PlannerRow label="Tasa de Cumplimiento" value={`${user.stats?.planner?.adherence ?? 0}%`} valueColor={panelTheme.secondaryColor} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <CourseMiniStat label="Tiempo Total" value={`${Math.round((user.stats?.courses?.total_lesson_time_minutes || 0) / 60)}h`} color={panelTheme.secondaryColor} />
                  <CourseMiniStat label="Lecciones" value={user.stats?.courses?.lessons_completed || 0} color={panelTheme.successColor} />
                  <CourseMiniStat label="Quizzes Aprobados" value={`${user.stats?.courses?.quizzes_passed || 0}/${user.stats?.courses?.quizzes_completed || 0}`} color={panelTheme.accentColor} />
                  <CourseMiniStat label="Notas Creadas" value={user.stats?.courses?.notes_count || 0} color={panelTheme.warningColor} />
                </div>

                <div className="p-5 rounded-3xl border" style={sectionStyle}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: panelTheme.secondaryColor }} />
                    Desglose por Curso
                  </h3>

                  {user.stats?.courses?.breakdown?.length > 0 ? (
                    <div className="space-y-4">
                      {user.stats.courses.breakdown.map((course, index) => (
                        <div key={`${course.course_id}-${index}`} className="p-3 rounded-2xl border" style={miniTileStyle}>
                          <div className="flex justify-between items-center mb-2 gap-3">
                            <span className="font-medium text-sm truncate flex-1">
                              {course.course_title}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor:
                                  course.status === 'completed'
                                    ? `${panelTheme.successColor}18`
                                    : course.status === 'active'
                                      ? `${panelTheme.secondaryColor}18`
                                      : `${panelTheme.mutedTextColor}18`,
                                color:
                                  course.status === 'completed'
                                    ? panelTheme.successColor
                                    : course.status === 'active'
                                      ? panelTheme.secondaryColor
                                      : panelTheme.subtextColor,
                              }}
                            >
                              {course.status === 'completed'
                                ? 'Completado'
                                : course.status === 'active'
                                  ? 'En Progreso'
                                  : 'Inscrito'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: panelTheme.hoverBg }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${course.progress || 0}%`,
                                  background: `linear-gradient(90deg, ${panelTheme.secondaryColor}, ${panelTheme.successColor})`,
                                }}
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
                    <div className="text-center py-8" style={{ color: panelTheme.subtextColor }}>
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay cursos inscritos</p>
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-3xl border" style={sectionStyle}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5" style={{ color: panelTheme.accentColor }} />
                    Interacciones con LIA
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CourseMiniStat label="Conversaciones" value={user.stats?.lia?.total_conversations || 0} color={panelTheme.accentColor} />
                    <CourseMiniStat label="Mensajes Totales" value={user.stats?.lia?.total_messages || 0} color={panelTheme.secondaryColor} />
                    <CourseMiniStat label="Preguntas del Usuario" value={user.stats?.lia?.user_messages || 0} color={panelTheme.warningColor} />
                    <CourseMiniStat label="Respuestas de LIA" value={user.stats?.lia?.assistant_responses || 0} color={panelTheme.successColor} />
                  </div>

                  {(user.stats?.lia?.contexts?.ai_chat > 0 ||
                    user.stats?.lia?.contexts?.course > 0) && (
                    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${panelTheme.dividerColor}` }}>
                      <p className="text-xs mb-2" style={{ color: panelTheme.subtextColor }}>
                        Contextos de uso:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.stats?.lia?.contexts?.ai_chat > 0 && (
                          <span
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: `${panelTheme.accentColor}18`,
                              color: panelTheme.accentColor,
                            }}
                          >
                            Chat General: {user.stats.lia.contexts.ai_chat}
                          </span>
                        )}
                        {user.stats?.lia?.contexts?.course > 0 && (
                          <span
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: `${panelTheme.secondaryColor}18`,
                              color: panelTheme.secondaryColor,
                            }}
                          >
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

function HeaderMetric({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode
  label: string
  value: string
  color: string
}) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm"
      style={{
        backgroundColor: panelTheme.inverseSurface,
        borderColor: panelTheme.inverseBorderColor,
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div>
        <p
          className="text-[10px] uppercase font-bold tracking-wider"
          style={{ color: panelTheme.inverseMutedTextColor }}
        >
          {label}
        </p>
        <p
          className="font-bold text-sm leading-none"
          style={{ color: panelTheme.inverseTextColor }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function PlannerRow({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string | number
  valueColor?: string
}) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div className="flex justify-between items-center">
      <span style={{ color: panelTheme.subtextColor }}>{label}</span>
      <span className="font-bold text-lg" style={{ color: valueColor ?? panelTheme.textColor }}>
        {value}
      </span>
    </div>
  )
}

function CourseMiniStat({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div
      className="p-4 rounded-2xl border text-center"
      style={{
        backgroundColor: panelTheme.inputBg,
        borderColor: panelTheme.borderColor,
      }}
    >
      <p className="text-3xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: panelTheme.subtextColor }}>
        {label}
      </p>
    </div>
  )
}
