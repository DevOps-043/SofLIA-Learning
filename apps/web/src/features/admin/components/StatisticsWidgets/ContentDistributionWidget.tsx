'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSurface } from '../ui'

const ResponsivePie = dynamic(() => import('@nivo/pie').then((mod) => mod.ResponsivePie), { ssr: false })

interface ContentDistribution {
  category: string
  count: number
  percentage: number
  color: string
}

export function ContentDistributionWidget() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [data, setData] = useState<ContentDistribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/admin/statistics/content-distribution')
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || t('statisticsWidgets.errors.loadData'))
        }
      } catch (err) {
        setError(t('statisticsWidgets.errors.contentDistribution'))
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [t])

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

  if (data.length === 0) {
    return (
      <AdminSurface className="p-6">
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {t('statisticsWidgets.empty')}
        </p>
      </AdminSurface>
    )
  }

  const chartData = data.map((item, index) => ({
    id: item.category,
    label: item.category,
    value: item.percentage,
    color: theme.chartColors[index % theme.chartColors.length],
  }))

  return (
    <AdminSurface className="p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold" style={{ color: theme.text }}>
          {t('statisticsWidgets.contentDistribution.title')}
        </h3>
        <div className="flex items-center text-sm" style={{ color: theme.textMuted }}>
          <ChartBarIcon className="mr-1 h-4 w-4" />
          {t('statisticsWidgets.contentDistribution.byCategory')}
        </div>
      </div>

      <div className="h-64">
        <ResponsivePie
          data={chartData}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ datum: 'data.color' }}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor={theme.textMuted}
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={theme.inverseText}
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
              itemTextColor: theme.textMuted,
              itemDirection: 'left-to-right',
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: 'circle',
            },
          ]}
          theme={{
            labels: {
              text: {
                fill: theme.inverseText,
                fontSize: 12,
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

      <div className="mt-6 space-y-3">
        {data.map((item, index) => (
          <div key={item.category} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center">
              <div
                className="mr-3 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: theme.chartColors[index % theme.chartColors.length] }}
              />
              <span className="truncate text-sm" style={{ color: theme.textMuted }}>
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: theme.text }}>
                {item.count}
              </span>
              <span className="text-sm" style={{ color: theme.textMuted }}>
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </AdminSurface>
  )
}
