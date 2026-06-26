import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { ChartShell } from './ChartShell'
import { EmptyChart } from './EmptyChart'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

interface TeamPoint {
  name: string
  x: number
  y: number
  z: number
  overdue: number
}

function getTeamColor(point: TeamPoint, theme: ThemeTokens): string {
  if (point.overdue > 0) return '#ef4444'
  if (point.x >= 60 && point.y >= 60) return theme.successColor
  if (point.x < 30 || point.y < 30) return '#ef4444'
  return '#f59e0b'
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: TeamPoint }>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

function CustomTooltip({ active, payload, theme, t }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg border p-3 text-xs shadow-lg"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor, minWidth: 160 }}
    >
      <p className="mb-2 font-semibold">{d.name}</p>
      <p style={{ color: theme.subtextColor }}>
        {t('reportsAnalytics.overview.averageProgress')}: <span className="font-medium" style={{ color: theme.textColor }}>{d.x}%</span>
      </p>
      <p style={{ color: theme.subtextColor }}>
        {t('reportsAnalytics.overview.completionRate')}: <span className="font-medium" style={{ color: theme.textColor }}>{d.y}%</span>
      </p>
      <p style={{ color: theme.subtextColor }}>
        {t('reportsAnalytics.table.users')}: <span className="font-medium" style={{ color: theme.textColor }}>{d.z}</span>
      </p>
      {d.overdue > 0 && (
        <p style={{ color: '#ef4444' }}>
          {t('reportsAnalytics.table.overdue')}: <span className="font-medium">{d.overdue}</span>
        </p>
      )}
    </div>
  )
}

interface TeamScatterChartProps {
  data: Pick<ReportsAnalyticsResponse, 'rankings'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function TeamScatterChart({ data, theme, t }: TeamScatterChartProps) {
  const teams = data.rankings.teams

  if (teams.length === 0) {
    return (
      <ChartShell
        title={t('reportsAnalytics.sections.teamScatter')}
        subtitle={t('reportsAnalytics.sections.teamScatterSubtitle')}
        theme={theme}
      >
        <EmptyChart theme={theme} />
      </ChartShell>
    )
  }

  const points: TeamPoint[] = teams.map((team) => ({
    name: team.name,
    x: Math.round(team.averageProgress),
    y: Math.round(team.completionRate * 100),
    z: team.users,
    overdue: team.overdueAssignments ?? 0,
  }))

  return (
    <ChartShell
      title={t('reportsAnalytics.sections.teamScatter')}
      subtitle={t('reportsAnalytics.sections.teamScatterSubtitle')}
      theme={theme}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
          <CartesianGrid stroke={theme.dividerColor} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            name="Progreso"
            tick={{ fill: theme.subtextColor, fontSize: 11 }}
            label={{
              value: t('reportsAnalytics.overview.averageProgress'),
              position: 'insideBottom',
              offset: -15,
              fill: theme.mutedTextColor,
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            name="Finalización"
            tick={{ fill: theme.subtextColor, fontSize: 11 }}
            label={{
              value: t('reportsAnalytics.overview.completionRate'),
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fill: theme.mutedTextColor,
              fontSize: 11,
            }}
          />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          {/* Quadrant lines at 60% */}
          <ReferenceLine x={60} stroke={theme.dividerColor} strokeDasharray="6 3" />
          <ReferenceLine y={60} stroke={theme.dividerColor} strokeDasharray="6 3" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: theme.dividerColor }}
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as Array<{ payload: TeamPoint }>}
                theme={theme}
                t={t}
              />
            )}
          />
          <Scatter data={points} isAnimationActive={false}>
            {points.map((point, i) => (
              <Cell key={i} fill={getTeamColor(point, theme)} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}
