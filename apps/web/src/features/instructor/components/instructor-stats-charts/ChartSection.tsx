'use client'

import { ResponsiveCalendar } from '@nivo/calendar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { useTheme } from '@/core/hooks/useTheme'
import { CHART_COLORS, getChartTheme } from './chart-theme'

// ─── CalendarChart ───────────────────────────────────────────────────────────

interface CalendarChartProps {
  data: Array<{ date: string; count: number }>
  height?: number
  title?: string
}

export function CalendarChart({ data, height = 400, title }: CalendarChartProps) {
  const { isDark } = useTheme()

  const chartData = data.map(item => ({ day: item.date, value: item.count }))

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  const dates = chartData.map(d => d.day).sort()
  const from = dates[0] || new Date().toISOString().split('T')[0]
  const to = dates[dates.length - 1] || new Date().toISOString().split('T')[0]

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveCalendar
          data={chartData}
          from={from}
          to={to}
          emptyColor={isDark ? '#1f2937' : '#f3f4f6'}
          colors={
            isDark
              ? ['#3b0764', '#581c87', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd']
              : ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed']
          }
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          yearSpacing={40}
          monthBorderColor={isDark ? '#374151' : '#e5e7eb'}
          dayBorderWidth={1.5}
          dayBorderColor={isDark ? '#374151' : '#e5e7eb'}
          theme={getChartTheme(isDark)}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'row',
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: 'right-to-left',
            },
          ]}
        />
      </div>
    </div>
  )
}

// ─── LineChart ───────────────────────────────────────────────────────────────

interface LineChartProps {
  data: Array<{ x: string | number; y: number }>
  height?: number
  title?: string
  xLabel?: string
  yLabel?: string
  color?: string
}

export function LineChart({
  data,
  height = 300,
  title,
  xLabel,
  yLabel,
  color = CHART_COLORS.primary,
}: LineChartProps) {
  const { isDark } = useTheme()

  const chartData = [{ id: 'value', data: data.map(item => ({ x: item.x, y: item.y })) }]

  if (!chartData[0].data || chartData[0].data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          yFormat=" >-.2f"
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: xLabel, legendOffset: 36, legendPosition: 'middle' }}
          axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: yLabel, legendOffset: -40, legendPosition: 'middle' }}
          pointSize={10}
          pointColor={color}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          theme={getChartTheme(isDark)}
          colors={[color]}
          legends={[]}
        />
      </div>
    </div>
  )
}

// ─── PieChart ────────────────────────────────────────────────────────────────

interface PieChartProps {
  data: Array<{ id: string; value: number; label?: string }>
  height?: number
  title?: string
}

export function PieChart({ data, height = 300, title }: PieChartProps) {
  const { isDark } = useTheme()

  const chartData = data.map(item => ({
    id: item.label || item.id,
    value: item.value,
    label: item.label || item.id,
  }))

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsivePie
          data={chartData}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor={isDark ? '#e5e7eb' : '#374151'}
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          theme={getChartTheme(isDark)}
          colors={[
            CHART_COLORS.primary,
            CHART_COLORS.secondary,
            CHART_COLORS.success,
            CHART_COLORS.warning,
            CHART_COLORS.info,
            CHART_COLORS.danger,
          ]}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: 56,
              itemsSpacing: 0,
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: isDark ? '#9ca3af' : '#6b7280',
              itemDirection: 'left-to-right',
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: 'circle',
            },
          ]}
        />
      </div>
    </div>
  )
}

// ─── BarChart ────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: Array<{ id: string; value: number; label?: string }>
  height?: number
  title?: string
  xLabel?: string
  yLabel?: string
}

export function BarChart({ data, height = 300, title, xLabel, yLabel }: BarChartProps) {
  const { isDark } = useTheme()

  const chartData = data.map(item => ({ id: item.label || item.id, value: item.value }))

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveBar
          data={chartData}
          keys={['value']}
          indexBy="id"
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={CHART_COLORS.primary}
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45, legend: xLabel, legendPosition: 'middle', legendOffset: 46 }}
          axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0, legend: yLabel, legendPosition: 'middle', legendOffset: -40 }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          theme={getChartTheme(isDark)}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [{ on: 'hover', style: { itemOpacity: 1 } }],
            },
          ]}
        />
      </div>
    </div>
  )
}
