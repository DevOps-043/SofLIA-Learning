'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CalendarCheck,
  FileText,
  Loader2,
  MessageSquare,
  NotebookPen,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { JoyrideClient } from '@/features/tours/components/JoyrideClient'
import { useTranslation } from 'react-i18next'
import { BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS } from '@/core/constants/tourTargets'
import { cn } from '@/shared/utils/cn'
import { useJoyrideMinitour } from '@/features/tours/hooks/useJoyrideMinitour'
import {
  BUSINESS_USER_ANALYTICS_MINITOUR_ID,
  buildBusinessUserAnalyticsMinitourSteps,
} from '@/features/tours/config/business-user-analytics-minitour-steps'
import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsInsightsResponse,
  BusinessUserAnalyticsRange,
  BusinessUserAnalyticsResponse,
  BusinessUserAnalyticsTrendPoint,
} from '@/features/business-panel/types/business-user-analytics.types'
import { BusinessUserAnalyticsHeatmap } from './BusinessUserAnalyticsHeatmap'

type LoadState = 'idle' | 'loading' | 'error' | 'ready'
type InsightState = 'idle' | 'loading' | 'error' | 'ready'
type AnalyticsApiResponse = BusinessUserAnalyticsResponse | { success: false; error?: string }
type InsightsApiResponse = BusinessUserAnalyticsInsightsResponse | { success: false; error?: string }

const RANGE_OPTIONS: BusinessUserAnalyticsRange[] = ['30d', '90d', '180d', '365d']
const COURSE_TITLE_WRAP_LENGTH = 44
const COURSE_TITLE_LINE_HEIGHT = 14
const RADAR_KEYS = ['courses', 'activities', 'soflia', 'notes', 'quizzes'] as const

type ChartTooltipPayload = {
  color?: string
  dataKey?: string | number
  name?: string | number
  payload?: {
    fullName?: string
  }
  value?: number | string
}

export function BusinessUserAnalyticsPageClient() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const { t, i18n } = useTranslation('business')
  const [range, setRange] = useState<BusinessUserAnalyticsRange>('365d')
  const [analytics, setAnalytics] = useState<BusinessUserAnalyticsResponse | null>(null)
  const [insights, setInsights] = useState<BusinessUserAnalyticsInsights | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [insightState, setInsightState] = useState<InsightState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)

  const locale = i18n.language === 'en' || i18n.language === 'pt' ? i18n.language : 'es'
  const translate = useCallback(
    (key: string, values?: Record<string, unknown>) => String(t(key, values)),
    [t],
  )
  const tourSteps = useMemo(
    () => buildBusinessUserAnalyticsMinitourSteps((key) => String(t(key))),
    [t],
  )
  const analyticsTour = useJoyrideMinitour({
    enabled: loadState === 'ready' && Boolean(analytics),
    label: String(t('analytics.actions.restartTour')),
    steps: tourSteps,
    tourId: BUSINESS_USER_ANALYTICS_MINITOUR_ID,
  })

  const loadAnalytics = useCallback(async () => {
    if (!orgSlug) return

    try {
      setLoadState('loading')
      setError(null)
      setInsights(null)
      setInsightError(null)

      const response = await fetch(`/api/${orgSlug}/business-user/analytics?range=${range}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = (await response.json()) as AnalyticsApiResponse

      if (!response.ok || ('success' in data && data.success === false)) {
        const errorMessage = 'error' in data ? (data as { error?: string }).error : null
        throw new Error(errorMessage || t('analytics.errors.load'))
      }

      setAnalytics(data)
      setLoadState('ready')
    } catch (loadError) {
      setAnalytics(null)
      setLoadState('error')
      setError(loadError instanceof Error ? loadError.message : t('analytics.errors.load'))
    }
  }, [orgSlug, range, t])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const generateInsights = useCallback(async () => {
    if (!orgSlug) return

    try {
      setInsightState('loading')
      setInsightError(null)

      const response = await fetch(`/api/${orgSlug}/business-user/analytics/insights`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ range, locale }),
      })
      const data = (await response.json()) as InsightsApiResponse

      if (!response.ok || ('success' in data && data.success === false)) {
        const errorMessage = 'error' in data ? (data as { error?: string }).error : null
        throw new Error(errorMessage || t('analytics.errors.insights'))
      }

      setInsights(data.insights)
      setInsightState('ready')
    } catch (insightLoadError) {
      setInsightState('error')
      setInsightError(
        insightLoadError instanceof Error ? insightLoadError.message : t('analytics.errors.insights'),
      )
    }
  }, [locale, orgSlug, range, t])

  const courseChartData = useMemo(() => {
    return (analytics?.learning.courses || [])
      .slice()
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 8)
      .map((course) => {
        const labelLines = wrapCourseTitle(course.courseTitle, COURSE_TITLE_WRAP_LENGTH)

        return {
          name: course.courseTitle,
          fullName: course.courseTitle,
          labelLines,
          progress: course.progress,
        }
      })
  }, [analytics?.learning.courses])
  const courseChartMaxTitleLines = Math.max(1, ...courseChartData.map((course) => course.labelLines.length))
  const courseChartRowHeight = Math.max(68, courseChartMaxTitleLines * COURSE_TITLE_LINE_HEIGHT + 34)
  const courseChartHeight = Math.max(360, courseChartData.length * courseChartRowHeight + 80)

  const engagementTrendData = useMemo(() => {
    if (!analytics) return []
    return mergeTrendSeries({
      lessons: analytics.learning.lessonTrend,
      messages: analytics.aiAdoption.messagesTrend,
      notes: analytics.notes.notesTrend,
      quizzes: analytics.quizzes.trend,
    })
  }, [analytics])

  const radarData = useMemo(() => {
    return (analytics?.quality.radar || []).map((item) => ({
      label: t(`analytics.quality.radar.${item.key}`),
      value: item.value,
    }))
  }, [analytics?.quality.radar, t])

  const goBack = useCallback(() => {
    if (!orgSlug) return
    router.push(`/${orgSlug}/business-user/dashboard`)
  }, [orgSlug, router])

  return (
    <main className="min-h-screen bg-[var(--color-bg-light)] text-gray-900 dark:bg-[var(--color-bg-dark)] dark:text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        <header id={BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.header} className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={goBack}
              className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              aria-label={t('analytics.actions.back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('analytics.eyebrow')}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">
                {t('analytics.title')}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
                {t('analytics.subtitle')}
              </p>
            </div>
          </div>

          <div id={BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.rangeControls} className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                  range === option
                    ? 'border-primary bg-primary text-white dark:border-accent dark:bg-accent dark:text-gray-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
                )}
              >
                {t(`analytics.ranges.${option}`)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void loadAnalytics()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              {t('analytics.actions.refresh')}
            </button>
          </div>
        </header>

        {loadState === 'loading' ? (
          <LoadingState label={t('analytics.loading')} />
        ) : loadState === 'error' ? (
          <ErrorState
            title={t('analytics.errors.title')}
            message={error || t('analytics.errors.load')}
            action={t('analytics.actions.retry')}
            onRetry={() => void loadAnalytics()}
          />
        ) : analytics ? (
          <>
            <section id={BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.metrics} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={BookOpen}
                label={t('analytics.metrics.averageProgress')}
                value={formatPercent(analytics.overview.averageProgress)}
                detail={t('analytics.metrics.assignedDetail', {
                  completed: analytics.overview.completedCourses,
                  total: analytics.overview.totalAssigned,
                })}
              />
              <MetricCard
                icon={Brain}
                label={t('analytics.metrics.aiAdoption')}
                value={formatPercent(analytics.aiAdoption.adoptionScore)}
                detail={t('analytics.metrics.aiDetail', {
                  conversations: analytics.aiAdoption.totalConversations,
                  messages: analytics.aiAdoption.totalMessages,
                })}
              />
              <MetricCard
                icon={CalendarCheck}
                label={t('analytics.metrics.planning')}
                value={formatPercent(analytics.planning.adherenceRate)}
                detail={t('analytics.metrics.planningDetail', {
                  completed: analytics.planning.completedSessions,
                  planned: analytics.planning.plannedSessions,
                })}
              />
              <MetricCard
                icon={Award}
                label={t('analytics.metrics.quality')}
                value={formatPercent(analytics.quality.overallScore)}
                detail={t('analytics.metrics.evidenceDetail', {
                  count: analytics.quality.evidenceCount,
                })}
              />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
              <div id={BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.courseProgress}>
                <Panel
                  icon={BarChart3}
                  title={t('analytics.sections.courseProgress')}
                  subtitle={t('analytics.sections.courseProgressSubtitle')}
                >
                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[960px]" style={{ height: courseChartHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={courseChartData}
                          layout="vertical"
                          margin={{ top: 12, right: 24, bottom: 8, left: 24 }}
                          barCategoryGap={18}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                            tickMargin={8}
                            tick={{ fill: 'currentColor', fontSize: 12 }}
                            className="text-gray-600 dark:text-gray-300"
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={400}
                            interval={0}
                            tick={<CourseAxisTick />}
                          />
                          <Tooltip
                            content={
                              <AnalyticsTooltip
                                valueFormatter={(value) => formatPercent(Number(value))}
                                labelFormatter={(label, payload) =>
                                  String(payload?.[0]?.payload?.fullName || label)
                                }
                              />
                            }
                          />
                          <Bar dataKey="progress" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Panel>
              </div>

              <Panel
                icon={Target}
                title={t('analytics.sections.learningSnapshot')}
                subtitle={t('analytics.sections.learningSnapshotSubtitle')}
              >
                <div className="space-y-4">
                  <SmallStat
                    label={t('analytics.learning.lessonsCompleted')}
                    value={formatNumber(analytics.overview.lessonsCompleted)}
                  />
                  <SmallStat
                    label={t('analytics.learning.timeSpent')}
                    value={formatStudyDuration(analytics.overview.timeSpentMinutes, translate)}
                  />
                  <SmallStat
                    label={t('analytics.learning.certificates')}
                    value={formatNumber(analytics.overview.certificates)}
                  />
                  <CourseList
                    courses={analytics.learning.courses.slice(0, 5)}
                    t={translate}
                  />
                </div>
              </Panel>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div id={BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.aiAdoption}>
                <Panel
                  icon={MessageSquare}
                  title={t('analytics.sections.aiAdoption')}
                  subtitle={t('analytics.sections.aiAdoptionSubtitle')}
                >
                <div className="grid grid-cols-2 gap-3">
                  <SmallStat label={t('analytics.ai.questions')} value={formatPercent(analytics.aiAdoption.questionRate)} />
                  <SmallStat label={t('analytics.ai.questionQuality')} value={formatPercent(analytics.aiAdoption.questionQualityScore)} />
                  <SmallStat label={t('analytics.ai.offTopic')} value={formatPercent(analytics.aiAdoption.offTopicRate)} />
                  <SmallStat label={t('analytics.ai.responseTime')} value={t('analytics.values.seconds', { value: formatNumber(analytics.aiAdoption.averageResponseTimeSeconds) })} />
                </div>
                <div className="mt-5 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-gray-600 dark:text-gray-300" />
                      <YAxis allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-gray-600 dark:text-gray-300" />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Line type="monotone" dataKey="messages" name={t('analytics.chart.messages')} stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="lessons" name={t('analytics.chart.lessons')} stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                </Panel>
              </div>

              <Panel
                icon={Sparkles}
                title={t('analytics.sections.quality')}
                subtitle={t('analytics.sections.qualitySubtitle')}
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="label" tick={<RadarAngleTick />} />
                      <Radar
                        dataKey="value"
                        stroke="var(--color-accent)"
                        fill="var(--color-accent)"
                        fillOpacity={0.35}
                      />
                      <Tooltip content={<AnalyticsTooltip valueFormatter={(value) => formatPercent(Number(value))} />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <RadarDescriptions t={translate} />
              </Panel>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
              <Panel icon={CalendarCheck} title={t('analytics.sections.planning')} compact>
                <StackedFacts
                  facts={[
                    [t('analytics.planning.completed'), `${analytics.planning.completedSessions}/${analytics.planning.plannedSessions}`],
                    [t('analytics.planning.missed'), formatNumber(analytics.planning.missedSessions)],
                    [t('analytics.planning.rescheduled'), formatNumber(analytics.planning.rescheduledSessions)],
                    [t('analytics.planning.actualMinutes'), t('analytics.values.minutes', { value: formatNumber(analytics.planning.averageActualMinutes) })],
                  ]}
                />
              </Panel>
              <Panel icon={NotebookPen} title={t('analytics.sections.notes')} compact>
                <StackedFacts
                  facts={[
                    [t('analytics.notes.total'), formatNumber(analytics.notes.totalNotes)],
                    [t('analytics.notes.adoption'), formatPercent(analytics.notes.adoptionRate)],
                    [t('analytics.notes.manual'), formatNumber(analytics.notes.manualNotes)],
                    [t('analytics.notes.averageLength'), formatNumber(analytics.notes.averageLength)],
                  ]}
                />
              </Panel>
              <Panel icon={FileText} title={t('analytics.sections.activities')} compact>
                <StackedFacts
                  facts={[
                    [t('analytics.activities.submissions'), formatNumber(analytics.activities.totalSubmissions)],
                    [t('analytics.activities.passRate'), formatPercent(analytics.activities.passRate)],
                    [t('analytics.activities.quality'), formatPercent(analytics.activities.averageQualityScore)],
                    [t('analytics.activities.feedback'), formatNumber(analytics.activities.withSofliaFeedback)],
                  ]}
                />
              </Panel>
              <Panel icon={Award} title={t('analytics.sections.quizzes')} compact>
                <StackedFacts
                  facts={[
                    [t('analytics.quizzes.attempts'), formatNumber(analytics.quizzes.attempts)],
                    [t('analytics.quizzes.passRate'), formatPercent(analytics.quizzes.passRate)],
                    [t('analytics.quizzes.average'), formatPercent(analytics.quizzes.averageScore)],
                    [t('analytics.quizzes.latest'), formatPercent(analytics.quizzes.latestScore)],
                  ]}
                />
              </Panel>
            </section>

            <div id={BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.feedback}>
              <Panel
                icon={Sparkles}
                title={t('analytics.sections.feedback')}
                subtitle={t('analytics.sections.feedbackSubtitle')}
                action={
                  <button
                    type="button"
                    onClick={() => void generateInsights()}
                    disabled={insightState === 'loading'}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-accent dark:text-gray-900 dark:hover:bg-accent/90"
                  >
                    {insightState === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {insightState === 'loading'
                      ? t('analytics.actions.generatingFeedback')
                      : t('analytics.actions.generateFeedback')}
                  </button>
                }
              >
                {insightState === 'error' ? (
                  <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
                    {insightError || t('analytics.errors.insights')}
                  </div>
                ) : insights ? (
                  <InsightsContent insights={insights} t={translate} />
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-800/60 dark:text-gray-300">
                    {t('analytics.feedback.empty')}
                  </div>
                )}
              </Panel>
            </div>

            <div id={BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS.heatmap}>
              <Panel
                icon={CalendarCheck}
                title={t('analytics.sections.heatmap')}
                subtitle={t('analytics.sections.heatmapSubtitle', {
                  count: analytics.contributionCalendar.reduce((sum, cell) => sum + cell.value, 0),
                })}
              >
                <BusinessUserAnalyticsHeatmap
                  cells={analytics.contributionCalendar}
                  locale={locale}
                  t={translate}
                />
              </Panel>
            </div>
          </>
        ) : null}
      </div>
      {analyticsTour.isMounted && analyticsTour.run ? (
        <JoyrideClient {...analyticsTour.joyrideProps} />
      ) : null}
    </main>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{detail}</p>
    </article>
  )
}

function Panel({
  icon: Icon,
  title,
  subtitle,
  action,
  compact,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  action?: ReactNode
  compact?: boolean
  children: ReactNode
}) {
  return (
    <section className={cn('rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-800', compact ? 'p-5' : 'p-5 sm:p-6')}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-900/40">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}

function CourseList({
  courses,
  t,
}: {
  courses: BusinessUserAnalyticsResponse['learning']['courses']
  t: (key: string, values?: Record<string, unknown>) => string
}) {
  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div key={course.courseId}>
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 flex-1 whitespace-normal break-words font-medium leading-snug">
              {course.courseTitle}
            </span>
            <span className="shrink-0 text-gray-500 dark:text-gray-400">
              {formatPercent(course.progress)}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-900">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t(`analytics.status.${course.status}`)}
          </p>
        </div>
      ))}
    </div>
  )
}

function CourseAxisTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number
  y?: number
  payload?: {
    value?: string
    payload?: {
      fullName?: string
      labelLines?: string[]
    }
  }
}) {
  const label = payload?.value || ''
  const fullName = payload?.payload?.fullName || label
  const labelLines = payload?.payload?.labelLines?.length
    ? payload.payload.labelLines
    : wrapCourseTitle(fullName, COURSE_TITLE_WRAP_LENGTH)
  const firstLineOffset = -((labelLines.length - 1) * COURSE_TITLE_LINE_HEIGHT) / 2 + 4

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullName}</title>
      <text
        x={0}
        textAnchor="end"
        fill="currentColor"
        className="text-xs text-gray-600 dark:text-gray-300"
      >
        {labelLines.map((line, index) => (
          <tspan
            key={`${line}-${index}`}
            x={0}
            dy={index === 0 ? firstLineOffset : COURSE_TITLE_LINE_HEIGHT}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function RadarAngleTick({
  x = 0,
  y = 0,
  payload,
  textAnchor,
}: {
  x?: number
  y?: number
  payload?: { value?: string }
  textAnchor?: 'middle' | 'start' | 'end' | 'inherit'
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor || 'middle'}
      fill="currentColor"
      className="text-xs text-gray-600 dark:text-gray-300"
      dy={4}
    >
      {payload?.value || ''}
    </text>
  )
}

function RadarDescriptions({
  t,
}: {
  t: (key: string, values?: Record<string, unknown>) => string
}) {
  return (
    <dl className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
      {RADAR_KEYS.map((key) => (
        <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-900/40">
          <dt className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {t(`analytics.quality.radar.${key}`)}
          </dt>
          <dd className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
            {t(`analytics.quality.radarDescriptions.${key}`)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function AnalyticsTooltip({
  active,
  label,
  labelFormatter,
  payload,
  valueFormatter,
}: {
  active?: boolean
  label?: string | number
  labelFormatter?: (label: string | number | undefined, payload: ChartTooltipPayload[]) => string
  payload?: ChartTooltipPayload[]
  valueFormatter?: (value: number | string) => string
}) {
  const visiblePayload = (payload || []).filter((item) => item.value !== undefined)
  if (!active || visiblePayload.length === 0) return null

  const resolvedLabel = labelFormatter
    ? labelFormatter(label, visiblePayload)
    : label

  return (
    <div className="max-w-xs rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg dark:border-white/10 dark:bg-gray-900">
      {resolvedLabel ? (
        <p className="mb-2 font-semibold text-gray-900 dark:text-white">
          {resolvedLabel}
        </p>
      ) : null}
      <div className="space-y-1">
        {visiblePayload.map((item) => (
          <div key={`${item.dataKey || item.name}-${item.value}`} className="flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-accent"
                style={item.color ? { backgroundColor: item.color } : undefined}
              />
              <span className="truncate">{item.name || item.dataKey}</span>
            </span>
            <span className="shrink-0 font-semibold text-gray-900 dark:text-white">
              {formatTooltipValue(item.value, valueFormatter)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StackedFacts({ facts }: { facts: Array<[string, string]> }) {
  return (
    <dl className="space-y-3">
      {facts.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 dark:border-white/10">
          <dt className="text-sm text-gray-600 dark:text-gray-300">{label}</dt>
          <dd className="text-sm font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function InsightsContent({
  insights,
  t,
}: {
  insights: BusinessUserAnalyticsInsights
  t: (key: string, values?: Record<string, unknown>) => string
}) {
  return (
    <div className="space-y-5">
      {insights.unavailable ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          {insights.summary}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-gray-900/40">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-gray-500 dark:text-gray-400">
              <span>{insights.cached ? t('analytics.feedback.cached') : t('analytics.feedback.generated')}</span>
              <span>{insights.model}</span>
            </div>
            <p className="text-sm leading-6 text-gray-700 dark:text-gray-200">{insights.summary}</p>
          </div>

          {insights.metrics.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {insights.metrics.map((metric) => (
                <SmallStat
                  key={`${metric.label}-${metric.value}`}
                  label={metric.label}
                  value={`${metric.value} - ${metric.detail}`}
                />
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <InsightList title={t('analytics.feedback.strengths')} items={insights.strengths} />
            <InsightList title={t('analytics.feedback.opportunities')} items={insights.opportunities} />
            <InsightList title={t('analytics.feedback.recommendations')} items={insights.recommendations} />
          </div>

          {insights.nextSteps.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {insights.nextSteps.map((section) => (
                <InsightList key={section.title} title={section.title} items={section.points} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-900/40">
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
        {items.map((item) => (
          <li key={item} className="leading-6">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-800">
      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </div>
    </div>
  )
}

function ErrorState({
  title,
  message,
  action,
  onRetry,
}: {
  title: string
  message: string
  action: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-error">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white"
      >
        <RefreshCw className="h-4 w-4" />
        {action}
      </button>
    </div>
  )
}

function mergeTrendSeries(input: {
  lessons: BusinessUserAnalyticsTrendPoint[]
  messages: BusinessUserAnalyticsTrendPoint[]
  notes: BusinessUserAnalyticsTrendPoint[]
  quizzes: BusinessUserAnalyticsTrendPoint[]
}) {
  const keys = new Map<string, { key: string; label: string; lessons: number; messages: number; notes: number; quizzes: number }>()

  ;(['lessons', 'messages', 'notes', 'quizzes'] as const).forEach((seriesKey) => {
    input[seriesKey].forEach((point) => {
      const current = keys.get(point.key) || {
        key: point.key,
        label: point.label,
        lessons: 0,
        messages: 0,
        notes: 0,
        quizzes: 0,
      }
      current[seriesKey] = point.value
      keys.set(point.key, current)
    })
  })

  return Array.from(keys.values()).sort((a, b) => a.key.localeCompare(b.key))
}

function formatTooltipValue(
  value: number | string | undefined,
  formatter?: (value: number | string) => string,
): string {
  if (value === undefined) return ''
  if (formatter) return formatter(value)
  if (typeof value === 'number') return formatNumber(value)
  return value
}

function formatPercent(value: number): string {
  return `${formatNumber(value)}%`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)
}

function formatStudyDuration(
  minutes: number,
  t: (key: string, values?: Record<string, unknown>) => string,
): string {
  const totalMinutes = Math.max(0, Math.round(minutes))
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours === 0) {
    return t('analytics.values.minutes', { value: formatNumber(totalMinutes) })
  }

  if (remainingMinutes === 0) {
    return t('analytics.values.hours', { value: formatNumber(hours) })
  }

  return t('analytics.values.hoursMinutes', {
    hours: formatNumber(hours),
    minutes: formatNumber(remainingMinutes),
  })
}

function wrapCourseTitle(value: string, maxLineLength = 44): string[] {
  const normalizedValue = value.trim().replace(/\s+/g, ' ')
  if (!normalizedValue) return ['']

  const lines: string[] = []
  let currentLine = ''

  normalizedValue.split(' ').forEach((word) => {
    if (!currentLine) {
      currentLine = word
      return
    }

    const nextLine = `${currentLine} ${word}`
    if (nextLine.length <= maxLineLength) {
      currentLine = nextLine
      return
    }

    lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}
