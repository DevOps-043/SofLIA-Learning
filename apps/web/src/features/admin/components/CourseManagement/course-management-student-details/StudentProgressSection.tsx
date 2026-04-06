'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Lightbulb,
  Rocket,
  Sprout,
  Star,
  Target,
  TrendingUp,
  Users2,
  LayoutDashboard,
  Book,
  FileText,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  buildCourseManagementStudentInsight,
  DEFAULT_ACTIVE_DAYS,
  DEFAULT_CONVERSATIONS_BY_WEEK,
  DEFAULT_CONVERSATION_TOPICS,
  DEFAULT_DAILY_STUDY_TIME,
  DEFAULT_PREFERRED_TIME_SLOTS,
  DEFAULT_WEEKLY_PROGRESS,
} from '../CourseManagementStudentDetails.service'
import {
  COURSE_MANAGEMENT_ACCENT_ICON_CLASS,
  COURSE_MANAGEMENT_CHART_COLORS,
  COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE,
  COURSE_MANAGEMENT_HIGHLIGHT_PANEL_CLASS,
  COURSE_MANAGEMENT_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_INSIGHT_BANNER_CLASS,
  COURSE_MANAGEMENT_INSIGHT_ICON_CLASS,
  COURSE_MANAGEMENT_INSET_SURFACE_CLASS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PANEL_SURFACE_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
  COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES,
  COURSE_MANAGEMENT_STUDY_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_SUCCESS_ICON_GRADIENT_CLASS,
  COURSE_MANAGEMENT_SUCCESS_PANEL_CLASS,
  COURSE_MANAGEMENT_WARNING_ICON_GRADIENT_CLASS,
} from '../courseManagementTheme'

type MetricCard = {
  icon: LucideIcon
  label: string
  value: string
  sublabel?: string
  gradient: string
}

function buildTickStyle(fontSize: number) {
  return {
    fill: COURSE_MANAGEMENT_CHART_COLORS.border,
    fontSize,
  }
}

export function MetricGrid({
  items,
  columnsClass,
  cardClass,
}: {
  items: MetricCard[]
  columnsClass: string
  cardClass: string
}) {
  return (
    <div className={`grid gap-4 ${columnsClass}`}>
      {items.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={cardClass}
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${metric.gradient}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className={`mb-1 text-2xl font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>
              {metric.value}
            </div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
              {metric.label}
            </div>
            {metric.sublabel ? (
              <div className={`mt-2 text-xs ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
                {metric.sublabel}
              </div>
            ) : null}
          </motion.div>
        )
      })}
    </div>
  )
}

export function PanelSection({
  className,
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  children,
}: {
  className: string
  icon: LucideIcon
  iconClassName: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <div className="mb-6 flex items-center gap-3">
        <div className={iconClassName}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>{title}</h3>
          <p className={`text-xs ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

interface StudentProgressSectionProps {
  studentDetailsData: NonNullable<ReturnType<typeof import('../CourseManagementContext')['useCourseManagementContext']>['state']['studentDetailsData']>
  selectedStudent: NonNullable<ReturnType<typeof import('../CourseManagementContext')['useCourseManagementContext']>['state']['selectedStudent']>
}

export function StudentProgressSection({ studentDetailsData, selectedStudent }: {
  studentDetailsData: Record<string, unknown>
  selectedStudent: Record<string, unknown>
}) {
  const sd = studentDetailsData as any
  const ss = selectedStudent as any

  const weeklyProgress =
    sd?.studySessions?.weeklyProgress?.length
      ? sd.studySessions.weeklyProgress
      : DEFAULT_WEEKLY_PROGRESS
  const dailyStudyTime =
    sd?.studySessions?.dailyStudyTime?.length
      ? sd.studySessions.dailyStudyTime
      : DEFAULT_DAILY_STUDY_TIME
  const preferredTimeSlots =
    sd?.studySessions?.preferredTimeSlots?.length
      ? sd.studySessions.preferredTimeSlots
      : DEFAULT_PREFERRED_TIME_SLOTS
  const activeDays =
    sd?.studySessions?.activeDays?.length
      ? sd.studySessions.activeDays
      : DEFAULT_ACTIVE_DAYS
  const conversationsByWeek =
    sd?.lia?.conversationsByWeek?.length
      ? sd.lia.conversationsByWeek.map((week: any, index: number) => ({
          semana: week.week || `S${index + 1}`,
          conversaciones: week.count || 0,
        }))
      : DEFAULT_CONVERSATIONS_BY_WEEK.map((week) => ({
          semana: week.week,
          conversaciones: week.count,
        }))
  const conversationTopics =
    sd?.lia?.conversationTopics?.length
      ? sd.lia.conversationTopics
      : DEFAULT_CONVERSATION_TOPICS

  const topMetrics: MetricCard[] = [
    {
      icon: Target,
      label: 'Progreso Total',
      value: `${Math.round(sd?.enrollment?.progressPercentage || ss?.progress_percentage || 0)}%`,
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary,
    },
    {
      icon: Clock,
      label: 'Tiempo de Estudio',
      value: `${sd?.studySessions?.totalCourseStudyTime || sd?.studySessions?.totalStudyTime || 0} hrs`,
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent,
    },
    {
      icon: CheckCircle2,
      label: 'Actividades Completadas',
      value: `${sd?.engagement?.activitiesCompleted || 0}`,
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success,
    },
    {
      icon: TrendingUp,
      label: 'Racha de Dias',
      value: `${sd?.studySessions?.studyStreak || 0} dias`,
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.warning,
    },
  ]

  const sofiaMetrics: MetricCard[] = [
    {
      icon: Rocket,
      label: 'Conversaciones Totales',
      value: `${sd?.lia?.totalConversations || 0}`,
      sublabel: `${sd?.lia?.conversationsThisWeek || 0} esta semana`,
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary,
    },
    {
      icon: Sprout,
      label: 'Mensajes Intercambiados',
      value: `${sd?.lia?.totalMessages || 0}`,
      sublabel: `Promedio: ${sd?.lia?.avgMessagesPerConversation || 0} por conversacion`,
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent,
    },
    {
      icon: Star,
      label: 'Feedback Positivo',
      value: `${sd?.lia?.positiveFeedbackRate || 0}%`,
      sublabel: `${sd?.lia?.positiveFeedbackCount || 0} de ${sd?.lia?.totalConversations || 0} conversaciones`,
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success,
    },
  ]

  const studyMetrics: MetricCard[] = [
    {
      icon: Clock,
      label: 'Sesiones Totales',
      value: `${sd?.studySessions?.totalSessions || 0}`,
      sublabel: sd?.studySessions?.lastSession?.hoursAgo
        ? `Ultima: Hace ${sd.studySessions.lastSession.hoursAgo} horas`
        : 'Sin sesiones',
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.success,
    },
    {
      icon: TrendingUp,
      label: 'Duracion Promedio',
      value: `${sd?.studySessions?.avgSessionDuration || 0} min`,
      sublabel: 'Por sesion',
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.accent,
    },
    {
      icon: Target,
      label: 'Tiempo Total',
      value: `${sd?.studySessions?.totalCourseStudyTime || sd?.studySessions?.totalStudyTime || 0} hrs`,
      sublabel: 'En este curso',
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.warning,
    },
    {
      icon: BarChart3,
      label: 'Frecuencia Semanal',
      value: `${sd?.studySessions?.weeklyFrequency || 0} dias`,
      sublabel: 'Promedio por semana',
      gradient: COURSE_MANAGEMENT_STAT_GRADIENT_CLASSES.primary,
    },
  ]

  return (
    <>
      <MetricGrid
        items={topMetrics}
        columnsClass="grid-cols-1 md:grid-cols-4"
        cardClass={`p-4 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelSection
          className={`p-6 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
          icon={BarChart3}
          iconClassName={`h-10 w-10 ${COURSE_MANAGEMENT_ICON_GRADIENT_CLASS}`}
          title="Progreso Semanal"
          subtitle="Ultimos 7 dias"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} opacity={0.3} />
                <XAxis dataKey="dia" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
                <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
                <Tooltip contentStyle={COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE} />
                <Bar dataKey="progreso" fill={COURSE_MANAGEMENT_CHART_COLORS.accent} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelSection>

        <PanelSection
          className={`p-6 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
          icon={Clock}
          iconClassName={`h-10 w-10 ${COURSE_MANAGEMENT_SUCCESS_ICON_GRADIENT_CLASS}`}
          title="Tiempo de Estudio"
          subtitle="Distribucion por dia"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStudyTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} opacity={0.3} />
                <XAxis dataKey="dia" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
                <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
                <Tooltip contentStyle={COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="horas" stroke={COURSE_MANAGEMENT_CHART_COLORS.success} strokeWidth={3} dot={{ fill: COURSE_MANAGEMENT_CHART_COLORS.success, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </PanelSection>
      </div>

      <PanelSection
        className={`p-6 ${COURSE_MANAGEMENT_PANEL_SURFACE_CLASS}`}
        icon={Users2}
        iconClassName={`h-10 w-10 ${COURSE_MANAGEMENT_WARNING_ICON_GRADIENT_CLASS}`}
        title="Metricas de Engagement"
        subtitle="Nivel de participacion del estudiante"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Sesiones Totales', value: `${sd.studySessions?.totalSessions || 0}`, icon: LayoutDashboard },
            { label: 'Promedio Diario', value: `${sd.engagement?.avgDailyTime || 0} hrs`, icon: Clock },
            { label: 'Lecciones Vistas', value: `${sd.engagement?.lessonsViewed || 0}`, icon: Book },
            { label: 'Notas Creadas', value: `${sd.engagement?.notesCreated || 0}`, icon: FileText },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
                </div>
                <div className={`mb-1 text-xl font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>{metric.value}</div>
                <div className={`text-xs ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{metric.label}</div>
              </div>
            )
          })}
        </div>
      </PanelSection>

      <PanelSection
        className={COURSE_MANAGEMENT_HIGHLIGHT_PANEL_CLASS}
        icon={Lightbulb}
        iconClassName={`h-12 w-12 rounded-xl shadow-lg ${COURSE_MANAGEMENT_ICON_GRADIENT_CLASS}`}
        title="Interaccion con SofLIA"
        subtitle="Analisis de conversaciones y asistencia personalizada"
      >
        <MetricGrid
          items={sofiaMetrics}
          columnsClass="grid-cols-1 md:grid-cols-3"
          cardClass={`p-4 shadow-sm ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}
        />

        <div className={`mt-6 p-5 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
          <div className="mb-4 flex items-center gap-2">
            <Rocket className={`h-5 w-5 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
            <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Frecuencia de Conversaciones</h4>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conversationsByWeek}>
                <defs>
                  <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COURSE_MANAGEMENT_CHART_COLORS.accent} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COURSE_MANAGEMENT_CHART_COLORS.accent} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} opacity={0.3} />
                <XAxis dataKey="semana" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
                <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(11)} />
                <Tooltip contentStyle={COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="conversaciones" stroke={COURSE_MANAGEMENT_CHART_COLORS.accent} fillOpacity={1} fill="url(#colorConversaciones)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {conversationTopics.map((topic: any) => (
            <div key={topic.tema} className={`p-3 text-center ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: topic.color }}>
                {topic.count}
              </div>
              <div className={`text-xs font-medium ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{topic.tema}</div>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection
        className={COURSE_MANAGEMENT_SUCCESS_PANEL_CLASS}
        icon={Clock}
        iconClassName={`h-12 w-12 rounded-xl shadow-lg ${COURSE_MANAGEMENT_STUDY_ICON_GRADIENT_CLASS}`}
        title="Habitos de Estudio"
        subtitle="Analisis de patrones y comportamiento de aprendizaje"
      >
        <MetricGrid
          items={studyMetrics}
          columnsClass="grid-cols-1 md:grid-cols-4"
          cardClass={`p-4 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}
        />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`p-5 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" style={{ color: COURSE_MANAGEMENT_CHART_COLORS.success }} />
              <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Horarios Preferidos</h4>
            </div>
            <div className="space-y-3">
              {preferredTimeSlots.map((slot: any) => (
                <div key={slot.periodo}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`text-xs font-medium ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>{slot.periodo}</span>
                    <span className={`text-xs font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>{slot.porcentaje}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full" style={{ backgroundColor: COURSE_MANAGEMENT_CHART_COLORS.grid }}>
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${slot.porcentaje}%`, backgroundColor: slot.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-5 ${COURSE_MANAGEMENT_INSET_SURFACE_CLASS}`}>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className={`h-5 w-5 ${COURSE_MANAGEMENT_ACCENT_ICON_CLASS}`} />
              <h4 className={`text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Dias Mas Activos</h4>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COURSE_MANAGEMENT_CHART_COLORS.grid} opacity={0.3} />
                  <XAxis dataKey="dia" stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(10)} />
                  <YAxis stroke={COURSE_MANAGEMENT_CHART_COLORS.border} tick={buildTickStyle(10)} />
                  <Tooltip contentStyle={{ ...COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE, fontSize: '12px' }} />
                  <Bar dataKey="sesiones" fill={COURSE_MANAGEMENT_CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </PanelSection>

      <div className={COURSE_MANAGEMENT_INSIGHT_BANNER_CLASS}>
        <div className="flex items-start gap-3">
          <div className={COURSE_MANAGEMENT_INSIGHT_ICON_CLASS}>
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <div>
            <h5 className={`mb-1 text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Insights de SofLIA</h5>
            <p className={`text-xs leading-relaxed ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
              {buildCourseManagementStudentInsight(sd.studySessions)}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
