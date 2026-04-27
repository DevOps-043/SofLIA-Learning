'use client'

import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarCheck2,
  Download,
  FileText,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import businessEn from '../../../../public/locales/en/business.json'
import businessEs from '../../../../public/locales/es/business.json'
import businessPt from '../../../../public/locales/pt/business.json'
import { useBusinessReportsAnalytics } from '../hooks/useBusinessReportsAnalytics'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import type {
  ReportsAnalyticsBreakdownItem,
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsConnectionCalendarCell,
  ReportsAnalyticsCourseRow,
  ReportsAnalyticsHierarchyRankingRow,
  ReportsAnalyticsOverview,
  ReportsAnalyticsResponse,
  ReportsAnalyticsSegmentRow,
  ReportsAnalyticsTimeGranularity,
  ReportsAnalyticsTrendPoint,
  ReportsAnalyticsUserRankingRow,
} from '../types/reports-analytics.types'

type ThemeTokens = ReturnType<typeof useBusinessPanelTheme>
type ReportsAnalyticsLocale = 'es' | 'en' | 'pt'
type SegmentDisplayRow = ReportsAnalyticsSegmentRow & {
  segmentType: string
  segmentLabel: string
}

const reportsAnalyticsResources = {
  es: businessEs.reportsAnalytics,
  en: businessEn.reportsAnalytics,
  pt: businessPt.reportsAnalytics,
} as const

const overviewMetricKeys: Array<{
  key: string
  icon: LucideIcon
  valueKey: keyof ReportsAnalyticsOverview
  suffixKey?: keyof ReportsAnalyticsOverview
  isPercent?: boolean
}> = [
  { key: 'activeLearners', icon: Users, valueKey: 'activeLearners', suffixKey: 'activeLearnerRate' },
  { key: 'averageProgress', icon: Target, valueKey: 'averageProgress', isPercent: true },
  { key: 'completionRate', icon: BookOpenCheck, valueKey: 'completionRate', isPercent: true },
  { key: 'qualityScore', icon: ShieldCheck, valueKey: 'qualityScore', isPercent: true },
  { key: 'sofliaAdoptionRate', icon: Brain, valueKey: 'sofliaAdoptionRate', isPercent: true },
  { key: 'plannerAdherenceRate', icon: CalendarCheck2, valueKey: 'plannerAdherenceRate', isPercent: true },
  { key: 'overdueAssignments', icon: AlertTriangle, valueKey: 'overdueAssignments' },
] as const

export function BusinessReportsAnalytics() {
  const { t: baseT, i18n } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const {
    data,
    insights,
    filters,
    isLoading,
    isExporting,
    isGeneratingInsights,
    isExportingInsightsPdf,
    error,
    updateFilter,
    resetFilters,
    refetch,
    exportAnalytics,
    generateInsights,
    exportInsightsPdf,
  } = useBusinessReportsAnalytics()

  const locale: ReportsAnalyticsLocale = isReportsAnalyticsLocale(i18n.language) ? i18n.language : 'es'
  const t = useReportsAnalyticsText(baseT as (key: string) => string, locale)

  return (
    <div className="w-full space-y-6">
      <section
        className="relative overflow-hidden rounded-lg border px-5 py-7 sm:px-8"
        style={{
          background: theme.heroBackground,
          borderColor: theme.heroBorderColor,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(${theme.inverseBorderColor} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                borderColor: theme.inverseBorderColor,
                color: theme.inverseSubtextColor,
                backgroundColor: theme.inverseSurface,
              }}
            >
              <BarChart3 className="h-4 w-4" />
              <span>{t('reportsAnalytics.eyebrow')}</span>
            </div>
            <h1
              className="text-3xl font-semibold leading-tight sm:text-4xl"
              style={{ color: theme.inverseTextColor }}
            >
              {t('reportsAnalytics.title')}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 sm:text-base" style={{ color: theme.inverseSubtextColor }}>
              {t('reportsAnalytics.description')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => generateInsights(locale)}
              disabled={!data || isGeneratingInsights}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: theme.inverseBorderColor,
                backgroundColor: theme.inverseSurface,
                color: theme.inverseTextColor,
              }}
            >
              {isGeneratingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t('reportsAnalytics.actions.generateInsights')}
            </button>
            <button
              type="button"
              onClick={() => exportAnalytics('csv_zip', locale)}
              disabled={!data || Boolean(isExporting)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: theme.onActionColor, color: theme.actionColor }}
            >
              {isExporting === 'csv_zip' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t('reportsAnalytics.actions.exportCsv')}
            </button>
            <button
              type="button"
              onClick={() => exportAnalytics('pdf', locale)}
              disabled={!data || Boolean(isExporting)}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: theme.inverseBorderColor,
                backgroundColor: theme.inverseSurface,
                color: theme.inverseTextColor,
              }}
            >
              {isExporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {t('reportsAnalytics.actions.exportPdf')}
            </button>
          </div>
        </div>
      </section>

      <FiltersBar
        data={data}
        filters={filters}
        theme={theme}
        t={t}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      {error ? (
        <StatePanel theme={theme} icon={AlertTriangle} title={t('reportsAnalytics.states.errorTitle')} message={t('reportsAnalytics.states.errorDescription')} />
      ) : null}

      {isLoading ? (
        <StatePanel theme={theme} icon={Loader2} title={t('reportsAnalytics.states.loadingTitle')} message={t('reportsAnalytics.states.loadingDescription')} spinning />
      ) : null}

      {!isLoading && data ? (
        <>
          <OverviewGrid data={data} theme={theme} t={t} />
          <AiInsightsPanel
            insights={insights}
            isGenerating={isGeneratingInsights}
            theme={theme}
            t={t}
            onGenerate={() => generateInsights(locale)}
            onExportPdf={() => exportInsightsPdf(locale)}
            isExportingPdf={isExportingInsightsPdf}
          />
          <div className="grid gap-5 xl:grid-cols-2">
            <LoginHeatmapCard data={data} theme={theme} t={t} locale={locale} />
            <TrendCard
              title={t('reportsAnalytics.sections.learningTrend')}
              subtitle={t('reportsAnalytics.sections.learningTrendSubtitle')}
              data={data.learning.completionsTrend}
              theme={theme}
              valueLabel={t('reportsAnalytics.chart.completedCourses')}
            />
            <BreakdownCard
              title={t('reportsAnalytics.sections.demographics')}
              subtitle={t('reportsAnalytics.sections.demographicsSubtitle')}
              data={data.demographics.ageBands}
              labelFormatter={(item) => translateDimension(t, 'ageBands', item)}
              theme={theme}
              variant="horizontalBar"
            />
            <BreakdownCard
              title={t('reportsAnalytics.sections.gender')}
              subtitle={t('reportsAnalytics.sections.genderSubtitle')}
              data={data.demographics.gender}
              labelFormatter={(item) => translateDimension(t, 'gender', item)}
              theme={theme}
              variant="donut"
            />
            <BreakdownCard
              title={t('reportsAnalytics.sections.progress')}
              subtitle={t('reportsAnalytics.sections.progressSubtitle')}
              data={data.learning.progressDistribution}
              labelFormatter={(item) => translateDimension(t, 'progressBands', item)}
              theme={theme}
              variant="radial"
            />
            <BreakdownCard
              title={t('reportsAnalytics.sections.jobTitles')}
              subtitle={t('reportsAnalytics.sections.jobTitlesSubtitle')}
              data={data.demographics.jobTitles}
              labelFormatter={(item) => item.key === 'unspecified' ? translateKey(t, 'gender', 'unspecified') : item.label}
              theme={theme}
              variant="horizontalBar"
            />
            <TrendCard
              title={t('reportsAnalytics.sections.sofliaTrend')}
              subtitle={t('reportsAnalytics.sections.sofliaTrendSubtitle')}
              data={data.soflia.conversationsTrend}
              theme={theme}
              valueLabel={t('reportsAnalytics.chart.conversations')}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <SummaryCard
              title={t('reportsAnalytics.sections.soflia')}
              icon={Brain}
              theme={theme}
              rows={[
                [t('reportsAnalytics.metrics.totalConversations'), data.soflia.totalConversations],
                [t('reportsAnalytics.metrics.totalMessages'), data.soflia.totalMessages],
                [t('reportsAnalytics.metrics.averageMessagesPerConversation'), data.soflia.averageMessagesPerConversation],
                [t('reportsAnalytics.metrics.sofliaCompletionRate'), `${data.soflia.completionRate}%`],
              ]}
            />
            <SummaryCard
              title={t('reportsAnalytics.sections.activities')}
              icon={Target}
              theme={theme}
              rows={[
                [t('reportsAnalytics.metrics.totalActivities'), data.activities.totalActivities],
                [t('reportsAnalytics.metrics.activityCompletionRate'), `${data.activities.completionRate}%`],
                [t('reportsAnalytics.metrics.quizAverageScore'), `${data.activities.quizAverageScore}%`],
                [t('reportsAnalytics.metrics.usersNeedingHelp'), data.activities.usersNeedingHelp],
              ]}
            />
            <SummaryCard
              title={t('reportsAnalytics.sections.notesPlanner')}
              icon={StickyNote}
              theme={theme}
              rows={[
                [t('reportsAnalytics.metrics.totalNotes'), data.notes.totalNotes],
                [t('reportsAnalytics.metrics.notesAdoptionRate'), `${data.notes.adoptionRate}%`],
                [t('reportsAnalytics.metrics.plannedSessions'), data.planner.plannedSessions],
                [t('reportsAnalytics.metrics.plannerAdherenceRate'), `${data.planner.adherenceRate}%`],
              ]}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
            <QualityScorePanel data={data} theme={theme} t={t} />
            <SegmentComparisonPanel data={data} theme={theme} t={t} />
          </div>

          <LeaderboardPanel data={data} theme={theme} t={t} />
          <CourseRiskTable courses={data.courses} theme={theme} t={t} />
          <DataQualityPanel data={data} theme={theme} t={t} />
        </>
      ) : null}
    </div>
  )
}

function FiltersBar({
  data,
  filters,
  theme,
  t,
  onFilterChange,
  onReset,
  onRefresh,
  isLoading,
}: {
  data: ReportsAnalyticsResponse | null
  filters: ReturnType<typeof useBusinessReportsAnalytics>['filters']
  theme: ThemeTokens
  t: (key: string) => string
  onFilterChange: ReturnType<typeof useBusinessReportsAnalytics>['updateFilter']
  onReset: () => void
  onRefresh: () => void
  isLoading: boolean
}) {
  const zones = useMemo(
    () => (data?.filterOptions.zones || []).filter((zone) => !filters.regionId || zone.regionId === filters.regionId),
    [data?.filterOptions.zones, filters.regionId],
  )
  const teams = useMemo(
    () => (data?.filterOptions.teams || []).filter((team) => {
      if (filters.zoneId && team.zoneId !== filters.zoneId) return false
      if (filters.regionId && team.regionId !== filters.regionId) return false
      return true
    }),
    [data?.filterOptions.teams, filters.regionId, filters.zoneId],
  )

  return (
    <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label={t('reportsAnalytics.filters.from')} theme={theme}>
          <input value={filters.from} onChange={(event) => onFilterChange('from', event.target.value)} type="date" className="w-full bg-transparent text-sm outline-none" style={{ color: theme.textColor }} />
        </FilterField>
        <FilterField label={t('reportsAnalytics.filters.to')} theme={theme}>
          <input value={filters.to} onChange={(event) => onFilterChange('to', event.target.value)} type="date" className="w-full bg-transparent text-sm outline-none" style={{ color: theme.textColor }} />
        </FilterField>
        <SelectFilter value={filters.courseId} label={t('reportsAnalytics.filters.course')} theme={theme} onChange={(value) => onFilterChange('courseId', value)} options={data?.filterOptions.courses || []} allLabel={t('reportsAnalytics.filters.allCourses')} />
        <SelectFilter value={filters.jobTitle} label={t('reportsAnalytics.filters.jobTitle')} theme={theme} onChange={(value) => onFilterChange('jobTitle', value)} options={data?.filterOptions.jobTitles || []} allLabel={t('reportsAnalytics.filters.allJobTitles')} />
        <SelectFilter value={filters.gender} label={t('reportsAnalytics.filters.gender')} theme={theme} onChange={(value) => onFilterChange('gender', value)} options={(data?.filterOptions.genders || []).map((item) => ({ ...item, label: translateKey(t, 'gender', item.value) }))} allLabel={t('reportsAnalytics.filters.allGenders')} />
        <SelectFilter value={filters.ageBand} label={t('reportsAnalytics.filters.ageBand')} theme={theme} onChange={(value) => onFilterChange('ageBand', value)} options={(data?.filterOptions.ageBands || []).map((item) => ({ ...item, label: translateKey(t, 'ageBands', item.value) }))} allLabel={t('reportsAnalytics.filters.allAgeBands')} />
        <SelectFilter value={filters.role} label={t('reportsAnalytics.filters.role')} theme={theme} onChange={(value) => onFilterChange('role', value)} options={(data?.filterOptions.roles || []).map((item) => ({ ...item, label: translateKey(t, 'roles', item.value) }))} allLabel={t('reportsAnalytics.filters.allRoles')} />
        <SelectFilter value={filters.status} label={t('reportsAnalytics.filters.status')} theme={theme} onChange={(value) => onFilterChange('status', value)} options={(data?.filterOptions.statuses || []).map((item) => ({ ...item, label: translateKey(t, 'statuses', item.value) }))} allLabel={t('reportsAnalytics.filters.allStatuses')} />
        <SelectFilter value={filters.regionId} label={t('reportsAnalytics.filters.region')} theme={theme} onChange={(value) => onFilterChange('regionId', value)} options={data?.filterOptions.regions || []} allLabel={t('reportsAnalytics.filters.allRegions')} />
        <SelectFilter value={filters.zoneId} label={t('reportsAnalytics.filters.zone')} theme={theme} onChange={(value) => onFilterChange('zoneId', value)} options={zones} allLabel={t('reportsAnalytics.filters.allZones')} />
        <SelectFilter value={filters.teamId} label={t('reportsAnalytics.filters.team')} theme={theme} onChange={(value) => onFilterChange('teamId', value)} options={teams} allLabel={t('reportsAnalytics.filters.allTeams')} />
      </div>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <GranularityControl
          value={filters.granularity}
          theme={theme}
          t={t}
          onChange={(value) => onFilterChange('granularity', value)}
        />
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onRefresh} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            <RefreshCcw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {t('reportsAnalytics.actions.refresh')}
          </button>
          <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: theme.borderColor, color: theme.textColor }}>
            <RotateCcw className="h-4 w-4" />
            {t('reportsAnalytics.actions.reset')}
          </button>
        </div>
      </div>
    </section>
  )
}

function GranularityControl({
  value,
  theme,
  t,
  onChange,
}: {
  value: ReportsAnalyticsTimeGranularity
  theme: ThemeTokens
  t: (key: string) => string
  onChange: (value: ReportsAnalyticsTimeGranularity) => void
}) {
  const options: ReportsAnalyticsTimeGranularity[] = ['day', 'month', 'year']

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
        {t('reportsAnalytics.filters.granularity')}
      </span>
      <div className="inline-flex w-fit rounded-lg border p-1" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
        {options.map((option) => {
          const isSelected = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className="rounded-md px-3 py-1.5 text-sm font-semibold transition"
              style={{
                backgroundColor: isSelected ? theme.actionColor : 'transparent',
                color: isSelected ? theme.onActionColor : theme.subtextColor,
              }}
            >
              {t(`reportsAnalytics.granularity.${option}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FilterField({ label, theme, children }: { label: string; theme: ThemeTokens; children: ReactNode }) {
  return (
    <label className="block rounded-lg border px-3 py-2" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function SelectFilter({
  value,
  label,
  options,
  allLabel,
  theme,
  onChange,
}: {
  value: string
  label: string
  options: Array<{ value: string; label: string }>
  allLabel: string
  theme: ThemeTokens
  onChange: (value: string) => void
}) {
  return (
    <FilterField label={label} theme={theme}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent text-sm outline-none" style={{ color: theme.textColor }}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FilterField>
  )
}

function OverviewGrid({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: (key: string) => string }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {overviewMetricKeys.map((metric) => {
        const Icon = metric.icon
        const rawValue = data.overview[metric.valueKey]
        const value = metric.isPercent ? `${rawValue}%` : rawValue
        const suffix = metric.suffixKey ? `${data.overview[metric.suffixKey]}%` : null
        return (
          <article key={metric.key} className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.mutedTextColor }}>
                  {t(`reportsAnalytics.overview.${metric.key}`)}
                </p>
                <p className="mt-3 text-3xl font-semibold" style={{ color: theme.textColor }}>
                  {value}
                </p>
                {suffix ? <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{suffix}</p> : null}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

function BreakdownCard({
  title,
  subtitle,
  data,
  labelFormatter,
  theme,
  variant,
}: {
  title: string
  subtitle: string
  data: ReportsAnalyticsBreakdownItem[]
  labelFormatter: (item: ReportsAnalyticsBreakdownItem) => string
  theme: ThemeTokens
  variant: 'horizontalBar' | 'donut' | 'radial'
}) {
  const chartData = data
    .map((item, index) => ({
      ...item,
      label: labelFormatter(item),
      fill: theme.chartColors[index % theme.chartColors.length],
    }))
    .filter((item) => item.value > 0)

  return (
    <ChartShell title={title} subtitle={subtitle} theme={theme}>
      {chartData.length === 0 ? (
        <EmptyChart theme={theme} />
      ) : variant === 'horizontalBar' ? (
        <ResponsiveContainer width="100%" height={280}>
          <RechartsBarChart
            data={chartData.slice(0, 8)}
            layout="vertical"
            margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid stroke={theme.dividerColor} horizontal={false} />
            <XAxis type="number" tick={{ fill: theme.subtextColor, fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={112}
              tick={{ fill: theme.subtextColor, fontSize: 11 }}
              interval={0}
            />
            <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={theme.actionColor}>
              {chartData.slice(0, 8).map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      ) : variant === 'radial' ? (
        <div className="grid h-full min-h-0 gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="26%" outerRadius="94%" barSize={12} data={chartData}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: theme.hoverBg }} />
              <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <BreakdownLegend data={chartData} theme={theme} />
        </div>
      ) : (
        <div className="grid h-full min-h-0 gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }} />
              <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={64} outerRadius={98} paddingAngle={2}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <BreakdownLegend data={chartData} theme={theme} />
        </div>
      )}
    </ChartShell>
  )
}

function BreakdownLegend({
  data,
  theme,
}: {
  data: Array<ReportsAnalyticsBreakdownItem & { fill: string }>
  theme: ThemeTokens
}) {
  return (
    <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
      {data.slice(0, 8).map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="truncate" style={{ color: theme.subtextColor }}>{item.label}</span>
          </div>
          <span className="shrink-0 font-semibold" style={{ color: theme.textColor }}>
            {item.value} - {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  )
}

function TrendCard({
  title,
  subtitle,
  data,
  theme,
  valueLabel,
}: {
  title: string
  subtitle: string
  data: ReportsAnalyticsTrendPoint[]
  theme: ThemeTokens
  valueLabel: string
}) {
  return (
    <ChartShell title={title} subtitle={subtitle} theme={theme}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 12 }}>
          <CartesianGrid stroke={theme.dividerColor} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: theme.subtextColor, fontSize: 11 }} />
          <YAxis tick={{ fill: theme.subtextColor, fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }}
            formatter={(value) => [value, valueLabel]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme.actionColor}
            strokeWidth={3}
            fill={theme.actionSurface}
            dot={{ r: 3, fill: theme.actionColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

function LoginHeatmapCard({
  data,
  theme,
  t,
  locale,
}: {
  data: ReportsAnalyticsResponse
  theme: ThemeTokens
  t: (key: string) => string
  locale: ReportsAnalyticsLocale
}) {
  const weeks = useMemo(() => buildCalendarWeeks(data.connectionCalendar), [data.connectionCalendar])
  const monthLabels = useMemo(() => buildCalendarMonthLabels(weeks, locale), [weeks, locale])
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const cellPitch = 18

  return (
    <section className="rounded-lg border p-4 xl:col-span-2" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.loginHeatmap')}</h2>
          <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.loginHeatmapSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: theme.subtextColor }}>
          <span>{t('reportsAnalytics.chart.less')}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="h-3 w-3 rounded-[3px] border"
              style={{
                backgroundColor: getConnectionCalendarColor(level as ReportsAnalyticsConnectionCalendarCell['level'], theme),
                borderColor: theme.dividerColor,
              }}
            />
          ))}
          <span>{t('reportsAnalytics.chart.more')}</span>
        </div>
      </div>

      {weeks.length > 0 ? (
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="min-w-max">
            <div className="ml-10 h-5" style={{ position: 'relative', width: `${weeks.length * cellPitch}px` }}>
              {monthLabels.map((month) => (
                <span
                  key={`${month.weekIndex}-${month.label}`}
                  className="absolute text-[11px]"
                  style={{ left: `${month.weekIndex * cellPitch}px`, color: theme.mutedTextColor }}
                >
                  {month.label}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="grid w-8 shrink-0 gap-1" style={{ gridTemplateRows: 'repeat(7, 14px)' }}>
                {weekdayKeys.map((dayKey) => (
                  <span key={dayKey} className="text-[11px] leading-[14px]" style={{ color: theme.subtextColor }}>
                    {['mon', 'wed', 'fri'].includes(dayKey) ? t(`reportsAnalytics.weekdays.${dayKey}`) : ''}
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                {weeks.map((week) => (
                  <div key={week.weekIndex} className="grid gap-1" style={{ gridTemplateRows: 'repeat(7, 14px)' }}>
                    {week.cells.map((cell, dayIndex) => (
                      <span
                        key={cell?.date || `${week.weekIndex}-${dayIndex}`}
                        title={cell ? `${formatCalendarDate(cell.date, locale)}: ${cell.value} ${t('reportsAnalytics.chart.lastConnections')}` : undefined}
                        className="h-3.5 w-3.5 rounded-[3px] border transition"
                        style={{
                          backgroundColor: cell ? getConnectionCalendarColor(cell.level, theme) : theme.hoverBg,
                          borderColor: theme.dividerColor,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 h-32">
          <EmptyChart theme={theme} />
        </div>
      )}
    </section>
  )
}

function AiInsightsPanel({
  insights,
  isGenerating,
  isExportingPdf,
  theme,
  t,
  onGenerate,
  onExportPdf,
}: {
  insights: ReportsAnalyticsAiInsights | null
  isGenerating: boolean
  isExportingPdf: boolean
  theme: ThemeTokens
  t: (key: string) => string
  onGenerate: () => void
  onExportPdf: () => void
}) {
  return (
    <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.aiInsights')}</h2>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.aiInsightsSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onGenerate} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t('reportsAnalytics.actions.generateInsights')}
          </button>
          <button type="button" onClick={onExportPdf} disabled={!insights || isExportingPdf} className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ borderColor: theme.borderColor, color: theme.textColor }}>
            {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {t('reportsAnalytics.actions.exportInsightsPdf')}
          </button>
        </div>
      </div>

      {insights ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-3 rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
            <p className="text-sm leading-6" style={{ color: theme.textColor }}>{insights.summary}</p>
          </div>
          {insights.executiveMetrics?.map((metric) => (
            <div key={`${metric.label}-${metric.value}`} className="rounded-lg border p-4" style={{ borderColor: theme.borderColor }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: theme.textColor }}>{metric.value}</p>
              <p className="mt-2 text-sm leading-5" style={{ color: theme.subtextColor }}>{metric.detail}</p>
            </div>
          ))}
          {insights.findings.map((section) => (
            <div key={section.title} className="rounded-lg border p-4" style={{ borderColor: theme.borderColor }}>
              <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.points.map((point) => (
                  <li key={point} className="text-sm leading-5" style={{ color: theme.subtextColor }}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
          <InsightList title={t('reportsAnalytics.ai.risks')} rows={insights.risks} theme={theme} />
          <InsightList title={t('reportsAnalytics.ai.recommendations')} rows={insights.recommendations} theme={theme} />
          {insights.actionPlan?.map((section) => (
            <InsightList key={section.title} title={section.title} rows={section.points} theme={theme} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border p-4 text-sm" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>
          {t('reportsAnalytics.ai.empty')}
        </div>
      )}
    </section>
  )
}

function InsightList({ title, rows, theme }: { title: string; rows: string[]; theme: ThemeTokens }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: theme.borderColor }}>
      <h3 className="text-sm font-semibold" style={{ color: theme.textColor }}>{title}</h3>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row} className="text-sm leading-5" style={{ color: theme.subtextColor }}>{row}</li>
        ))}
      </ul>
    </div>
  )
}

function QualityScorePanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: (key: string) => string }) {
  return (
    <SummaryCard
      title={t('reportsAnalytics.sections.responseQuality')}
      icon={ShieldCheck}
      theme={theme}
      rows={[
        [t('reportsAnalytics.metrics.qualityScore'), `${data.quality.overallScore}%`],
        [t('reportsAnalytics.metrics.quizScore'), `${data.quality.quizScore}%`],
        [t('reportsAnalytics.metrics.activityScore'), `${data.quality.activityScore}%`],
        [t('reportsAnalytics.metrics.sofliaScore'), `${data.quality.sofliaScore}%`],
        [t('reportsAnalytics.metrics.offTopicRate'), `${data.quality.offTopicRate}%`],
        [t('reportsAnalytics.metrics.helpRate'), `${data.quality.helpRate}%`],
      ]}
    />
  )
}

function SegmentComparisonPanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: (key: string) => string }) {
  const rows: SegmentDisplayRow[] = [
    ...data.segments.ageBands.slice(0, 4).map((row) => ({
      ...row,
      label: translateKey(t, 'ageBands', row.key, row.label),
      segmentType: 'age',
      segmentLabel: t('reportsAnalytics.filters.ageBand'),
    })),
    ...data.segments.gender.slice(0, 4).map((row) => ({
      ...row,
      label: translateKey(t, 'gender', row.key, row.label),
      segmentType: 'gender',
      segmentLabel: t('reportsAnalytics.filters.gender'),
    })),
    ...data.segments.jobTitles.slice(0, 4).map((row) => ({
      ...row,
      segmentType: 'job_title',
      segmentLabel: t('reportsAnalytics.filters.jobTitle'),
    })),
    ...data.segments.roles.slice(0, 4).map((row) => ({
      ...row,
      label: translateKey(t, 'roles', row.key, row.label),
      segmentType: 'role',
      segmentLabel: t('reportsAnalytics.filters.role'),
    })),
  ].sort((a, b) => b.users - a.users || b.qualityScore - a.qualityScore).slice(0, 8)

  const chartRows = rows.slice(0, 6).map((row) => ({
    ...row,
    shortLabel: truncateLabel(row.label, 18),
  }))

  return (
    <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.segmentComparison')}</h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.segmentComparisonSubtitle')}</p>
      </div>
      <div className="mt-4 h-64">
        {chartRows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 24 }}>
              <CartesianGrid stroke={theme.dividerColor} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: theme.subtextColor, fontSize: 11 }} />
              <YAxis type="category" dataKey="shortLabel" width={112} tick={{ fill: theme.subtextColor, fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }}
                formatter={(value, name) => [
                  `${value}%`,
                  name === 'averageProgress' ? t('reportsAnalytics.table.progress') : t('reportsAnalytics.table.quality'),
                ]}
              />
              <Bar dataKey="averageProgress" radius={[0, 6, 6, 0]} fill={theme.actionColor} />
              <Bar dataKey="qualityScore" radius={[0, 6, 6, 0]} fill={theme.successColor} />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart theme={theme} />
        )}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <SegmentInsightCard key={`${row.segmentType}-${row.key}`} row={row} theme={theme} t={t} />
        ))}
      </div>
    </section>
  )
}

function SegmentInsightCard({ row, theme, t }: { row: SegmentDisplayRow; theme: ThemeTokens; t: (key: string) => string }) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>{row.segmentLabel}</p>
          <h3 className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>{row.label}</h3>
        </div>
        <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          {row.users} {t('reportsAnalytics.table.users')}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <ProgressMeter label={t('reportsAnalytics.table.progress')} value={row.averageProgress} theme={theme} color={theme.actionColor} />
        <ProgressMeter label={t('reportsAnalytics.table.completion')} value={row.completionRate} theme={theme} color={theme.successColor} />
        <div className="grid grid-cols-3 gap-2 text-center">
          <CompactMetric label={t('reportsAnalytics.table.soflia')} value={`${row.sofliaAdoptionRate}%`} theme={theme} />
          <CompactMetric label={t('reportsAnalytics.table.notes')} value={`${row.notesAdoptionRate}%`} theme={theme} />
          <CompactMetric label={t('reportsAnalytics.table.quality')} value={`${row.qualityScore}%`} theme={theme} />
        </div>
      </div>
    </article>
  )
}

function ProgressMeter({ label, value, theme, color }: { label: string; value: number; theme: ThemeTokens; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span style={{ color: theme.subtextColor }}>{label}</span>
        <span className="font-semibold" style={{ color: theme.textColor }}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function CompactMetric({ label, value, theme }: { label: string; value: string; theme: ThemeTokens }) {
  return (
    <div className="rounded-lg px-2 py-2" style={{ backgroundColor: theme.cardBg }}>
      <div className="text-[10px] uppercase tracking-[0.08em]" style={{ color: theme.mutedTextColor }}>{label}</div>
      <div className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>{value}</div>
    </div>
  )
}

function LeaderboardPanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: (key: string) => string }) {
  const hierarchyRows = [
    ...data.rankings.regions.slice(0, 5),
    ...data.rankings.zones.slice(0, 5),
    ...data.rankings.teams.slice(0, 5),
  ].sort((a, b) => b.rankScore - a.rankScore).slice(0, 6)
  const userRows = data.rankings.users.slice(0, 6)

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="flex items-center gap-3 border-b p-4" style={{ borderColor: theme.borderColor }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.hierarchyLeaderboard')}</h2>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.hierarchyLeaderboardSubtitle')}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {hierarchyRows.map((row, index) => (
            <HierarchyRankCard key={`${row.type}-${row.id}`} row={row} rank={index + 1} theme={theme} t={t} />
          ))}
        </div>
      </section>
      <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
          <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.userLeaderboard')}</h2>
          <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.userLeaderboardSubtitle')}</p>
        </div>
        <div className="mt-4 space-y-3">
          {userRows.map((row, index) => (
            <UserRankCard key={row.userId} row={row} rank={index + 1} theme={theme} t={t} />
          ))}
        </div>
      </section>
    </section>
  )
}

function HierarchyRankCard({
  row,
  rank,
  theme,
  t,
}: {
  row: ReportsAnalyticsHierarchyRankingRow
  rank: number
  theme: ThemeTokens
  t: (key: string) => string
}) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
            {rank}. {t(`reportsAnalytics.hierarchy.${row.type}`)}
          </p>
          <h3 className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>{row.name}</h3>
        </div>
        <span className="rounded-lg px-2 py-1 text-sm font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          {row.rankScore}%
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <CompactMetric label={t('reportsAnalytics.table.users')} value={String(row.users)} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.progress')} value={`${row.averageProgress}%`} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.quality')} value={`${row.qualityScore}%`} theme={theme} />
      </div>
    </article>
  )
}

function UserRankCard({
  row,
  rank,
  theme,
  t,
}: {
  row: ReportsAnalyticsUserRankingRow
  rank: number
  theme: ThemeTokens
  t: (key: string) => string
}) {
  return (
    <article className="rounded-lg border p-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
            {rank}. {row.teamName}
          </p>
          <h3 className="mt-1 truncate text-sm font-semibold" style={{ color: theme.textColor }}>{row.displayName}</h3>
          <p className="mt-1 text-xs" style={{ color: theme.subtextColor }}>{row.jobTitle}</p>
        </div>
        <span className="w-fit rounded-lg px-2 py-1 text-sm font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          {row.rankScore}%
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <CompactMetric label={t('reportsAnalytics.table.progress')} value={`${row.averageProgress}%`} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.completion')} value={`${row.completionRate}%`} theme={theme} />
        <CompactMetric label={t('reportsAnalytics.table.quality')} value={`${row.qualityScore}%`} theme={theme} />
      </div>
    </article>
  )
}

function ChartShell({ title, subtitle, theme, children }: { title: string; subtitle: string; theme: ThemeTokens; children: ReactNode }) {
  return (
    <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{title}</h2>
      <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{subtitle}</p>
      <div className="mt-4 h-[280px] min-w-0">{children}</div>
    </section>
  )
}

function SummaryCard({ title, icon: Icon, rows, theme }: { title: string; icon: LucideIcon; rows: Array<[string, string | number]>; theme: ThemeTokens }) {
  return (
    <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold" style={{ color: theme.textColor }}>{title}</h2>
      </div>
      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 border-b pb-2 last:border-b-0 last:pb-0" style={{ borderColor: theme.dividerColor }}>
            <span className="text-sm" style={{ color: theme.subtextColor }}>{label}</span>
            <span className="text-sm font-semibold" style={{ color: theme.textColor }}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function CourseRiskTable({ courses, theme, t }: { courses: ReportsAnalyticsCourseRow[]; theme: ThemeTokens; t: (key: string) => string }) {
  return (
    <section className="rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.courseRisk')}</h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.courseRiskSubtitle')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead style={{ color: theme.mutedTextColor }}>
            <tr>
              {['course', 'assigned', 'active', 'completed', 'progress', 'overdue', 'soflia'].map((key) => (
                <th key={key} className="px-4 py-3 font-semibold uppercase tracking-[0.1em]">{t(`reportsAnalytics.table.${key}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.slice(0, 12).map((course) => (
              <tr key={course.courseId} className="border-t" style={{ borderColor: theme.borderColor }}>
                <td className="px-4 py-3 font-medium" style={{ color: theme.textColor }}>{course.courseTitle}</td>
                <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.assignedUsers}</td>
                <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.activeLearners}</td>
                <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.completedUsers}</td>
                <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.averageProgress}%</td>
                <td className="px-4 py-3" style={{ color: course.overdueAssignments > 0 ? theme.dangerColor : theme.subtextColor }}>{course.overdueAssignments}</td>
                <td className="px-4 py-3" style={{ color: theme.subtextColor }}>{course.sofliaConversations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DataQualityPanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: (key: string) => string }) {
  const totalUsers = Math.max(data.overview.totalUsers, 1)
  const missingRows = data.dataQuality.missingFields.map((item) => ({
    ...item,
    label: translateDimension(t, 'missingFields', item),
  }))

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      <SummaryCard
        title={t('reportsAnalytics.sections.dataQuality')}
        icon={FileText}
        theme={theme}
        rows={[
          [t('reportsAnalytics.metrics.demographicsCompletionRate'), `${data.dataQuality.demographicsCompletionRate}%`],
          [t('reportsAnalytics.metrics.usersWithCompleteDemographics'), data.dataQuality.usersWithCompleteDemographics],
          [t('reportsAnalytics.metrics.usersMissingDemographics'), data.dataQuality.usersMissingDemographics],
        ]}
      />
      <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.missingFields')}</h2>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.missingFieldsSubtitle')}</p>
          </div>
          <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            {data.dataQuality.demographicsCompletionRate}%
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {missingRows.map((item) => (
            <div key={item.key}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span style={{ color: theme.textColor }}>{item.label}</span>
                <span className="font-semibold" style={{ color: theme.subtextColor }}>
                  {item.value} {t('reportsAnalytics.chart.missingUsers')} - {item.percentage}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: theme.hoverBg }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((item.value / totalUsers) * 100, 100)}%`,
                    backgroundColor: item.value > 0 ? theme.warningColor : theme.successColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function StatePanel({ theme, icon: Icon, title, message, spinning = false }: { theme: ThemeTokens; icon: LucideIcon; title: string; message: string; spinning?: boolean }) {
  return (
    <section className="rounded-lg border p-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          <Icon className={spinning ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
        </div>
        <div>
          <h2 className="font-semibold" style={{ color: theme.textColor }}>{title}</h2>
          <p className="text-sm" style={{ color: theme.subtextColor }}>{message}</p>
        </div>
      </div>
    </section>
  )
}

function EmptyChart({ theme }: { theme: ThemeTokens }) {
  const { t } = useTranslation('business')
  return (
    <div className="flex h-full items-center justify-center rounded-lg border" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>
      <span className="text-sm">{t('reportsAnalytics.states.emptyChart')}</span>
    </div>
  )
}

function buildCalendarWeeks(cells: ReportsAnalyticsConnectionCalendarCell[]) {
  const weekMap = new Map<number, Array<ReportsAnalyticsConnectionCalendarCell | null>>()

  cells.forEach((cell) => {
    const weekCells = weekMap.get(cell.weekIndex) || Array.from(
      { length: 7 },
      () => null as ReportsAnalyticsConnectionCalendarCell | null,
    )
    weekCells[cell.dayIndex] = cell
    weekMap.set(cell.weekIndex, weekCells)
  })

  return Array.from(weekMap.entries())
    .sort(([weekA], [weekB]) => weekA - weekB)
    .map(([weekIndex, weekCells]) => ({
      weekIndex,
      cells: weekCells,
    }))
}

function buildCalendarMonthLabels(
  weeks: Array<{ weekIndex: number; cells: Array<ReportsAnalyticsConnectionCalendarCell | null> }>,
  locale: ReportsAnalyticsLocale,
) {
  let currentMonth = ''
  return weeks.flatMap((week) => {
    const firstCell = week.cells.find((cell): cell is ReportsAnalyticsConnectionCalendarCell => Boolean(cell))
    if (!firstCell || firstCell.monthKey === currentMonth) return []

    currentMonth = firstCell.monthKey
    return [{
      weekIndex: week.weekIndex,
      label: formatCalendarMonth(firstCell.monthKey, locale),
    }]
  })
}

function getConnectionCalendarColor(level: ReportsAnalyticsConnectionCalendarCell['level'], theme: ThemeTokens): string {
  if (level === 0) return theme.hoverBg
  if (level === 1) return `color-mix(in srgb, ${theme.successColor} 24%, ${theme.cardBg})`
  if (level === 2) return `color-mix(in srgb, ${theme.successColor} 46%, ${theme.cardBg})`
  if (level === 3) return `color-mix(in srgb, ${theme.successColor} 70%, ${theme.cardBg})`
  return theme.successColor
}

function formatCalendarMonth(monthKey: string, locale: ReportsAnalyticsLocale): string {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return monthKey
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date)
}

function formatCalendarDate(dateKey: string, locale: ReportsAnalyticsLocale): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return dateKey
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

function truncateLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`
}

function translateDimension(t: (key: string) => string, group: string, item: ReportsAnalyticsBreakdownItem): string {
  return translateKey(t, group, item.key, item.label)
}

function translateKey(t: (key: string) => string, group: string, key: string, fallback?: string): string {
  const translationKey = `reportsAnalytics.${group}.${key}`
  const translated = t(translationKey)
  return translated === translationKey ? fallback || key : translated
}

function useReportsAnalyticsText(
  baseT: (key: string) => string,
  locale: ReportsAnalyticsLocale,
): (key: string) => string {
  return useCallback(
    (key: string) => {
      if (!key.startsWith('reportsAnalytics.')) {
        return baseT(key)
      }

      const value = getNestedTranslation(
        reportsAnalyticsResources[locale],
        key.replace('reportsAnalytics.', ''),
      )

      if (typeof value === 'string') {
        return value
      }

      return baseT(key)
    },
    [baseT, locale],
  )
}

function getNestedTranslation(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[segment]
  }, source)
}

function isReportsAnalyticsLocale(language: string): language is ReportsAnalyticsLocale {
  return language === 'es' || language === 'en' || language === 'pt'
}
