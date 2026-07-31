import dynamic from 'next/dynamic'
import type { ReportsAnalyticsAiInsights, ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { AcademicPerformanceCards } from './AcademicPerformanceCards'
import { AiInsightsPanel } from './AiInsightsPanel'
import { CourseRiskTable } from './CourseRiskTable'
import { DataQualityPanel } from './DataQualityPanel'
import { ExecutiveKpiGrid } from './ExecutiveKpiGrid'
import { LearningFunnelChart } from './LearningFunnelChart'
import { NotesCompositionPanel } from './NotesCompositionPanel'
import { ProgressOverviewTable } from './ProgressOverviewTable'
import { RankingTablesPanel } from './RankingTablesPanel'
import { RiskPrioritiesTable } from './RiskPrioritiesTable'
import { SegmentPerformancePanel } from './SegmentPerformancePanel'
import { SofLIAQualityPanel } from './SofLIAQualityPanel'
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'

const ChartSkeleton = () => <div className={styles.chartSkeleton} aria-hidden="true" />

const LearningTrendChart = dynamic(
  () => import('./LearningTrendChart').then((m) => ({ default: m.LearningTrendChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const OrgRadarChart = dynamic(
  () => import('./OrgRadarChart').then((m) => ({ default: m.OrgRadarChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const TeamScatterChart = dynamic(
  () => import('./TeamScatterChart').then((m) => ({ default: m.TeamScatterChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const WorkforceStatusPanel = dynamic(
  () => import('./WorkforceStatusPanel').then((m) => ({ default: m.WorkforceStatusPanel })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const ComplianceBarChart = dynamic(
  () => import('./ComplianceBarChart').then((m) => ({ default: m.ComplianceBarChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

export function ReportsLoadedContent({
  data,
  insights,
  isExportingInsightsPdf,
  isGeneratingInsights,
  theme,
  t,
  onCourseFilterChange,
  onExportInsightsPdf,
  onGenerateInsights,
}: {
  data: ReportsAnalyticsResponse
  insights: ReportsAnalyticsAiInsights | null
  isExportingInsightsPdf: boolean
  isGeneratingInsights: boolean
  locale: ReportsAnalyticsLocale
  theme: ThemeTokens
  t: ReportsAnalyticsT
  onCourseFilterChange: (courseId: string) => void
  onExportInsightsPdf: () => void
  onGenerateInsights: () => void
}) {
  return (
    <div className={styles.contentStack}>
      <div id="tour-reports-kpi">
        <ExecutiveKpiGrid data={data} t={t} />
      </div>

      <ProgressOverviewTable
        data={data}
        t={t}
        onCourseChange={onCourseFilterChange}
      />

      <section className={styles.sectionBlock} aria-labelledby="reports-learning-overview-title">
        <SectionIntro
          id="reports-learning-overview-title"
          title={t('reportsAnalytics.groups.learningTitle')}
          description={t('reportsAnalytics.groups.learningDescription')}
        />

        <div className={styles.twoColumnGrid}>
          <div id="tour-reports-workforce" className={styles.surfaceFrame}>
            <WorkforceStatusPanel data={data} theme={theme} t={t} />
          </div>
          <div id="tour-reports-radar" className={styles.surfaceFrame}>
            <OrgRadarChart data={data} theme={theme} t={t} />
          </div>
        </div>

        <div id="tour-reports-funnel" className={styles.surfaceFrame}>
          <LearningFunnelChart data={data} theme={theme} t={t} />
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="reports-risk-title">
        <SectionIntro
          id="reports-risk-title"
          title={t('reportsAnalytics.groups.riskTitle')}
          description={t('reportsAnalytics.groups.riskDescription')}
        />

        <div id="tour-reports-risk-users" className={styles.surfaceFrame}>
          <RiskPrioritiesTable priorityUsers={data.priorityUsers} theme={theme} t={t} />
        </div>

        <div id="tour-reports-compliance" className={styles.surfaceFrame}>
          <ComplianceBarChart data={data} theme={theme} t={t} />
        </div>

        <div id="tour-reports-course-risk" className={styles.surfaceFrame}>
          <CourseRiskTable courses={data.courses} theme={theme} t={t} />
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="reports-performance-title">
        <SectionIntro
          id="reports-performance-title"
          title={t('reportsAnalytics.groups.performanceTitle')}
          description={t('reportsAnalytics.groups.performanceDescription')}
        />

        <div className={styles.balancedGrid}>
          <div id="tour-reports-scatter" className={styles.surfaceFrame}>
            <TeamScatterChart data={data} theme={theme} t={t} />
          </div>
          <div id="tour-reports-trend" className={styles.surfaceFrame}>
            <LearningTrendChart data={data} theme={theme} t={t} />
          </div>
        </div>

        <div id="tour-reports-ranking" className={styles.surfaceFrame}>
          <RankingTablesPanel data={data} theme={theme} t={t} />
        </div>

        <div id="tour-reports-segments" className={styles.surfaceFrame}>
          <SegmentPerformancePanel data={data} theme={theme} t={t} />
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="reports-quality-title">
        <SectionIntro
          id="reports-quality-title"
          title={t('reportsAnalytics.groups.qualityTitle')}
          description={t('reportsAnalytics.groups.qualityDescription')}
        />

        <div id="tour-reports-academic" className={styles.surfaceFrame}>
          <AcademicPerformanceCards data={data} theme={theme} t={t} />
        </div>

        <div id="tour-reports-soflia-quality" className={styles.surfaceFrame}>
          <SofLIAQualityPanel data={data} theme={theme} t={t} />
        </div>

        <div id="tour-reports-notes" className={styles.surfaceFrame}>
          <NotesCompositionPanel data={data} theme={theme} t={t} />
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="reports-intelligence-title">
        <SectionIntro
          id="reports-intelligence-title"
          title={t('reportsAnalytics.groups.intelligenceTitle')}
          description={t('reportsAnalytics.groups.intelligenceDescription')}
        />

        <div id="tour-reports-insights" className={styles.surfaceFrame}>
          <AiInsightsPanel
            insights={insights}
            isExportingPdf={isExportingInsightsPdf}
            isGenerating={isGeneratingInsights}
            theme={theme}
            t={t}
            onExportPdf={onExportInsightsPdf}
            onGenerate={onGenerateInsights}
          />
        </div>

        <div className={styles.surfaceFrame}>
          <DataQualityPanel data={data} theme={theme} t={t} />
        </div>
      </section>
    </div>
  )
}

function SectionIntro({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <header className={styles.sectionHeader}>
      <div>
        {eyebrow ? <p className={styles.sectionEyebrow}>{eyebrow}</p> : null}
        <h2 id={id} className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>
    </header>
  )
}
