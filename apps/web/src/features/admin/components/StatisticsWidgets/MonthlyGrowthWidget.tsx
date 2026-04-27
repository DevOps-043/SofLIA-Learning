'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSurface } from '../ui'

const ResponsiveLine = dynamic(() => import('@nivo/line').then((mod) => mod.ResponsiveLine), { ssr: false })

interface MonthlyGrowthData {
  month: string
  monthNumber: number
  year: number
  users: number
  courses: number
  communities: number
  prompts: number
  aiApps: number
}

interface MonthlyGrowthWidgetProps {
  period?: number
  metrics?: string[]
}

export function MonthlyGrowthWidget({ period = 8, metrics = ['users'] }: MonthlyGrowthWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [data, setData] = useState<MonthlyGrowthData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/statistics/monthly-growth?period=${period}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || t('statisticsWidgets.errors.loadData'))
        }
      } catch (err) {
        setError(t('statisticsWidgets.errors.monthlyGrowth'))
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [period, t])

  if (isLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="h-64 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      </AdminSurface>
    )
  }

  if (error) {
    return (
      <AdminSurface className="p-6">
        <p className="text-sm font-semibold" style={{ color: theme.danger }}>
          {error}
        </p>
      </AdminSurface>
    )
  }

  const labelMap: Record<string, string> = {
    users: t('statisticsWidgets.metrics.users'),
    courses: t('statisticsWidgets.metrics.courses'),
    communities: t('statisticsWidgets.metrics.communities'),
    prompts: t('statisticsWidgets.metrics.prompts'),
    aiApps: t('statisticsWidgets.metrics.aiApps'),
  }

  const chartData = metrics.map((metric, index) => ({
    id: labelMap[metric] || metric,
    color: theme.chartColors[index % theme.chartColors.length],
    data: data.map((item) => ({
      x: item.month,
      y: item[metric as keyof MonthlyGrowthData] as number,
    })),
  }))

  return (
    <AdminSurface className="p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold" style={{ color: theme.text }}>
          {t('statisticsWidgets.monthlyGrowth.title')}
        </h3>
        <div className="flex items-center text-sm" style={{ color: theme.textMuted }}>
          <CalendarIcon className="mr-1 h-4 w-4" />
          {t('statisticsWidgets.monthlyGrowth.period', { period })}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 0,
            max: 'auto',
            stacked: false,
            reverse: false,
          }}
          yFormat=" >-.0f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: t('statisticsWidgets.monthlyGrowth.monthAxis'),
            legendOffset: 36,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: t('statisticsWidgets.monthlyGrowth.countAxis'),
            legendOffset: -40,
            legendPosition: 'middle',
          }}
          colors={{ datum: 'color' }}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: theme.hover,
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
          theme={{
            axis: {
              domain: {
                line: {
                  stroke: theme.border,
                  strokeWidth: 1,
                },
              },
              legend: {
                text: {
                  fill: theme.textMuted,
                  fontSize: 12,
                },
              },
              ticks: {
                line: {
                  stroke: theme.border,
                  strokeWidth: 1,
                },
                text: {
                  fill: theme.textMuted,
                  fontSize: 11,
                },
              },
            },
            grid: {
              line: {
                stroke: theme.divider,
                strokeWidth: 1,
              },
            },
            legends: {
              text: {
                fill: theme.textMuted,
                fontSize: 11,
              },
            },
            tooltip: {
              container: {
                background: theme.surface,
                color: theme.text,
                fontSize: 12,
              },
            },
          }}
        />
      </div>
    </AdminSurface>
  )
}
