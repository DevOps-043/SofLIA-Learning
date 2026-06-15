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
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/cn'
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
const RADAR_KEYS = ['courses', 'activities', 'soflia', 'notes', 'quizzes'] as const

type EngagementTrendRow = {
  key: string
  label: string
  lessons: number
  messages: number
  notes: number
  quizzes: number
}

interface BusinessUserAnalyticsPageClientProps {
  embedded?: boolean
  orgSlug?: string
  showBackButton?: boolean
  userId?: string
  onBack?: () => void
  /**
   * Ruta base de la API de analytics. Si se provee, tiene prioridad sobre la
   * resolución basada en `orgSlug`/`userId`: el dataset se consulta en
   * `${apiBasePath}?range=` y los insights en `${apiBasePath}/insights`.
   * Usado por el panel del superadministrador (`/api/admin/users/<id>/analytics`).
   */
  apiBasePath?: string
  /** Notifica el dataset cargado (para exportaciones externas, p.ej. PDF). */
  onAnalyticsLoaded?: (data: BusinessUserAnalyticsResponse) => void
  /** Notifica los insights de IA generados (para incluirlos en exportaciones). */
  onInsightsLoaded?: (insights: BusinessUserAnalyticsInsights) => void
}

export function BusinessUserAnalyticsPageClient({
  embedded = false,
  orgSlug: explicitOrgSlug,
  showBackButton = true,
  userId,
  onBack,
  apiBasePath,
  onAnalyticsLoaded,
  onInsightsLoaded,
}: BusinessUserAnalyticsPageClientProps = {}) {
  const router = useRouter()
  const params = useParams()
  const orgSlug = explicitOrgSlug || (params?.orgSlug as string | undefined)
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

  const analyticsUrl = useMemo(() => {
    if (apiBasePath) return `${apiBasePath}?range=${range}`
    if (!orgSlug) return null
    const baseUrl = userId
      ? `/api/${orgSlug}/business/users/${userId}/analytics`
      : `/api/${orgSlug}/business-user/analytics`
    return `${baseUrl}?range=${range}`
  }, [apiBasePath, orgSlug, range, userId])

  const insightsUrl = useMemo(() => {
    if (apiBasePath) return `${apiBasePath}/insights`
    if (!orgSlug) return null
    return userId
      ? `/api/${orgSlug}/business/users/${userId}/analytics/insights`
      : `/api/${orgSlug}/business-user/analytics/insights`
  }, [apiBasePath, orgSlug, userId])

  const loadAnalytics = useCallback(async () => {
    if (!analyticsUrl) return

    try {
      setLoadState('loading')
      setError(null)
      setInsights(null)
      setInsightError(null)

      const response = await fetch(analyticsUrl, {
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
      onAnalyticsLoaded?.(data)
    } catch (loadError) {
      setAnalytics(null)
      setLoadState('error')
      setError(loadError instanceof Error ? loadError.message : t('analytics.errors.load'))
    }
  }, [analyticsUrl, onAnalyticsLoaded, t])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const generateInsights = useCallback(async () => {
    if (!insightsUrl) return

    try {
      setInsightState('loading')
      setInsightError(null)

      const response = await fetch(insightsUrl, {
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
      onInsightsLoaded?.(data.insights)
    } catch (insightLoadError) {
      setInsightState('error')
      setInsightError(
        insightLoadError instanceof Error ? insightLoadError.message : t('analytics.errors.insights'),
      )
    }
  }, [insightsUrl, locale, onInsightsLoaded, range, t])

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
    if (onBack) {
      onBack()
      return
    }
    if (!orgSlug) return
    router.push(`/${orgSlug}/business-user/dashboard`)
  }, [onBack, orgSlug, router])

  const content = (
      <div
        className={cn(
          'flex w-full flex-col gap-6',
          embedded ? 'px-0 py-0' : 'mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10',
        )}
      >
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            {showBackButton ? (
              <button
                type="button"
                onClick={goBack}
                className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label={t('analytics.actions.back')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
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

          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  // `no-theme`: el botón gestiona su propio contraste; evita que el
                  // override de texto del tema de organización pise `text-white`.
                  'no-theme rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
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
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                icon={Award}
                label={t('analytics.metrics.quality')}
                value={formatPercent(analytics.quality.overallScore)}
                detail={t('analytics.metrics.evidenceDetail', {
                  count: analytics.quality.evidenceCount,
                })}
              />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
              <div>
                <Panel
                  icon={BarChart3}
                  title={t('analytics.sections.courseProgress')}
                  subtitle={t('analytics.sections.courseProgressSubtitle')}
                >
                  <div className="overflow-x-auto pb-2">
                    <div className="min-w-[960px]">
                      <CourseProgressChart courses={courseChartData} />
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
              <div>
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
                <EngagementLineChart
                  data={engagementTrendData}
                  lessonsLabel={t('analytics.chart.lessons')}
                  messagesLabel={t('analytics.chart.messages')}
                />
                </Panel>
              </div>

              <Panel
                icon={Sparkles}
                title={t('analytics.sections.quality')}
                subtitle={t('analytics.sections.qualitySubtitle')}
              >
                <div className="h-72">
                  <QualityRadarChart data={radarData} />
                </div>
                <RadarDescriptions t={translate} />
              </Panel>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
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
                    [t('analytics.quizzes.taken'), `${formatNumber(analytics.quizzes.quizzesTaken)} / ${formatNumber(analytics.quizzes.lessonsWithQuiz)}`],
                    [t('analytics.quizzes.passed'), formatNumber(analytics.quizzes.quizzesPassed)],
                    [t('analytics.quizzes.average'), formatPercent(analytics.quizzes.averageScore)],
                    [t('analytics.quizzes.totalAttempts'), formatNumber(analytics.quizzes.totalAttempts)],
                  ]}
                />
              </Panel>
            </section>

            <div>
              <Panel
                icon={Sparkles}
                title={t('analytics.sections.feedback')}
                subtitle={t('analytics.sections.feedbackSubtitle')}
                action={
                  <button
                    type="button"
                    onClick={() => void generateInsights()}
                    disabled={insightState === 'loading'}
                    className="no-theme inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-accent dark:text-gray-900 dark:hover:bg-accent/90"
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

            <div>
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
  )

  if (embedded) {
    return <div className="w-full text-gray-900 dark:text-white">{content}</div>
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg-light)] text-gray-900 dark:bg-[var(--color-bg-dark)] dark:text-white">
      {content}
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

function CourseProgressChart({
  courses,
}: {
  courses: Array<{
    fullName: string
    labelLines: string[]
    name: string
    progress: number
  }>
}) {
  return (
    <div className="space-y-5">
      {courses.map((course) => (
        <div
          key={course.fullName}
          className="grid grid-cols-[360px_minmax(360px,1fr)] items-center gap-4"
          title={`${course.fullName}: ${formatPercent(course.progress)}`}
        >
          <div className="text-right text-xs font-medium leading-snug text-gray-600 dark:text-gray-300">
            {course.labelLines.map((line, index) => (
              <div key={`${course.fullName}-${line}-${index}`}>{line}</div>
            ))}
          </div>
          <div className="relative h-16 border-l border-gray-300 dark:border-white/20">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-gray-200 dark:border-white/10" />
            <div
              className="absolute left-0 top-1/2 h-10 -translate-y-1/2 rounded-r-md bg-accent"
              style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
            />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[360px_minmax(360px,1fr)] items-center gap-4">
        <div />
        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          {[0, 25, 50, 75, 100].map((value) => (
            <span key={value}>{formatPercent(value)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EngagementLineChart({
  data,
  lessonsLabel,
  messagesLabel,
}: {
  data: EngagementTrendRow[]
  lessonsLabel: string
  messagesLabel: string
}) {
  const width = 680
  const height = 260
  const padding = { top: 20, right: 24, bottom: 42, left: 44 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...data.map((point) => Math.max(point.lessons, point.messages)))
  const xFor = (index: number) =>
    padding.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth)
  const yFor = (value: number) =>
    padding.top + plotHeight - (Math.max(0, value) / maxValue) * plotHeight
  const messagesPath = data.map((point, index) => `${xFor(index)},${yFor(point.messages)}`).join(' ')
  const lessonsPath = data.map((point, index) => `${xFor(index)},${yFor(point.lessons)}`).join(' ')
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio))
  const labelStep = Math.max(1, Math.ceil(data.length / 6))

  return (
    <div className="mt-5 h-64">
      <svg
        aria-hidden="true"
        className="h-full w-full overflow-visible text-gray-600 dark:text-gray-300"
        viewBox={`0 0 ${width} ${height}`}
      >
        {yTicks.map((tick, tickIndex) => {
          const y = yFor(tick)

          return (
            <g key={tickIndex}>
              <line
                stroke="var(--color-gray-200)"
                strokeDasharray="3 3"
                strokeWidth="1"
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="dark:opacity-30"
              />
              <text
                dominantBaseline="middle"
                fill="currentColor"
                fontSize="11"
                textAnchor="end"
                x={padding.left - 10}
                y={y}
              >
                {tick}
              </text>
            </g>
          )
        })}

        <polyline
          fill="none"
          points={messagesPath}
          stroke="var(--color-accent)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <polyline
          fill="none"
          points={lessonsPath}
          stroke="var(--color-primary)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        {data.map((point, index) => {
          if (index % labelStep !== 0 && index !== data.length - 1) return null

          return (
            <text
              key={point.key}
              fill="currentColor"
              fontSize="11"
              textAnchor="middle"
              x={xFor(index)}
              y={height - 16}
            >
              {point.label}
            </text>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {messagesLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {lessonsLabel}
        </span>
      </div>
    </div>
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

function QualityRadarChart({
  data,
}: {
  data: Array<{ label: string; value: number }>
}) {
  if (data.length === 0) return null

  const size = 320
  const center = size / 2
  const radius = 92
  const labelRadius = 136
  const gridLevels = [20, 40, 60, 80, 100]
  const radarPoints = buildRadarPoints(data, center, radius)
  const areaPoints = radarPoints.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full overflow-visible text-gray-600 dark:text-gray-300"
      viewBox={`0 0 ${size} ${size}`}
    >
      {gridLevels.map((level) => (
        <polygon
          key={level}
          fill="none"
          points={buildRadarPoints(data, center, (radius * level) / 100)
            .map((point) => `${point.x},${point.y}`)
            .join(' ')}
          stroke="var(--color-gray-200)"
          strokeDasharray={level === 100 ? '0' : '3 3'}
          strokeWidth="1"
          className="dark:opacity-30"
        />
      ))}

      {data.map((item, index) => {
        const angle = getRadarAngle(index, data.length)
        const x = center + Math.cos(angle) * radius
        const y = center + Math.sin(angle) * radius

        return (
          <line
            key={`${item.label}-axis`}
            stroke="var(--color-gray-200)"
            strokeWidth="1"
            x1={center}
            x2={x}
            y1={center}
            y2={y}
            className="dark:opacity-30"
          />
        )
      })}

      <polygon
        fill="var(--color-accent)"
        fillOpacity="0.35"
        points={areaPoints}
        stroke="var(--color-accent)"
        strokeLinejoin="round"
        strokeWidth="2"
      />

      {radarPoints.map((point) => (
        <circle
          key={`${point.label}-point`}
          cx={point.x}
          cy={point.y}
          fill="var(--color-accent)"
          r="4"
          stroke="var(--color-bg-light)"
          strokeWidth="2"
          className="dark:stroke-gray-800"
        >
          <title>{`${point.label}: ${formatPercent(point.value)}`}</title>
        </circle>
      ))}

      {data.map((item, index) => {
        const angle = getRadarAngle(index, data.length)
        const x = center + Math.cos(angle) * labelRadius
        const y = center + Math.sin(angle) * labelRadius
        const anchor = Math.abs(Math.cos(angle)) < 0.2
          ? 'middle'
          : Math.cos(angle) > 0
            ? 'start'
            : 'end'

        return (
          <text
            key={`${item.label}-label`}
            dominantBaseline="middle"
            fill="currentColor"
            fontSize="12"
            fontWeight="600"
            textAnchor={anchor}
            x={x}
            y={y}
          >
            {item.label}
          </text>
        )
      })}
    </svg>
  )
}

function buildRadarPoints(
  data: Array<{ label: string; value: number }>,
  center: number,
  radius: number,
) {
  return data.map((item, index) => {
    const angle = getRadarAngle(index, data.length)
    const valueRadius = radius * Math.min(1, Math.max(0, item.value / 100))

    return {
      label: item.label,
      value: item.value,
      x: center + Math.cos(angle) * valueRadius,
      y: center + Math.sin(angle) * valueRadius,
    }
  })
}

function getRadarAngle(index: number, total: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / total
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
        className="no-theme mt-4 inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white"
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
}): EngagementTrendRow[] {
  const keys = new Map<string, EngagementTrendRow>()

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
