import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { ChartShell } from './ChartShell'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

const BENCHMARK = 70

interface OrgRadarChartProps {
  data: Pick<ReportsAnalyticsResponse, 'overview' | 'quality'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

function buildRadarData(
  data: OrgRadarChartProps['data'],
  t: ReportsAnalyticsT,
) {
  const { overview, quality } = data
  return [
    {
      axis: t('reportsAnalytics.radar.activity'),
      value: Math.round(overview.activeLearnerRate),
      benchmark: BENCHMARK,
    },
    {
      axis: t('reportsAnalytics.radar.progress'),
      value: Math.round(overview.averageProgress),
      benchmark: BENCHMARK,
    },
    {
      axis: t('reportsAnalytics.radar.compliance'),
      value: Math.round(overview.complianceRate),
      benchmark: BENCHMARK,
    },
    {
      axis: t('reportsAnalytics.radar.academicQuality'),
      value: Math.round(quality.quizAverageScore),
      benchmark: BENCHMARK,
    },
    {
      axis: t('reportsAnalytics.radar.soflia'),
      value: Math.round(overview.sofliaAdoptionRate),
      benchmark: BENCHMARK,
    },
    {
      axis: t('reportsAnalytics.radar.planner'),
      value: Math.round(overview.plannerAdherenceRate),
      benchmark: BENCHMARK,
    },
  ]
}

export function OrgRadarChart({ data, theme, t }: OrgRadarChartProps) {
  const radarData = buildRadarData(data, t)

  return (
    <ChartShell
      title={t('reportsAnalytics.sections.orgRadar')}
      subtitle={t('reportsAnalytics.sections.orgRadarSubtitle')}
      theme={theme}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke={theme.dividerColor} />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: theme.subtextColor, fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={5}
            tick={{ fill: theme.mutedTextColor, fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
              fontSize: 12,
              borderRadius: 8,
            }}
            formatter={(value, name) => [
              `${String(value ?? 0)}%`,
              name === 'value' ? t('reportsAnalytics.radar.org') : t('reportsAnalytics.radar.target'),
            ]}
          />
          {/* Benchmark reference polygon */}
          <Radar
            name="benchmark"
            dataKey="benchmark"
            stroke={theme.dividerColor}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="transparent"
          />
          {/* Org actual values */}
          <Radar
            name="value"
            dataKey="value"
            stroke={theme.accentColor}
            strokeWidth={2.5}
            fill={theme.accentColor}
            fillOpacity={0.18}
            dot={{ r: 4, fill: theme.accentColor, strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}
