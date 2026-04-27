'use client'

import { useEffect, useMemo, useState } from 'react'
import { FireIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSurface } from '../ui'
import { HeatmapDetailModal } from './HeatmapDetailModal'

interface HeatmapData {
  dayOfWeek: number
  hour: number
  count: number
  avgResponseTime?: number
}

interface ActivityHeatmapWidgetProps {
  period?: string
  isLoading?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, index) => index)

export function ActivityHeatmapWidget({ period = 'month', isLoading: externalLoading }: ActivityHeatmapWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [data, setData] = useState<HeatmapData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ day: number; hour: number } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0)
  const [peakHour, setPeakHour] = useState<{ day: string; hour: string; count: number } | null>(null)
  const days = [
    t('liaAnalyticsWidgets.heatmap.days.sun'),
    t('liaAnalyticsWidgets.heatmap.days.mon'),
    t('liaAnalyticsWidgets.heatmap.days.tue'),
    t('liaAnalyticsWidgets.heatmap.days.wed'),
    t('liaAnalyticsWidgets.heatmap.days.thu'),
    t('liaAnalyticsWidgets.heatmap.days.fri'),
    t('liaAnalyticsWidgets.heatmap.days.sat'),
  ]

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/lia-analytics/heatmap?period=${period}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data.heatmap)
          setTotalMessages(result.data.totalMessages)
          setPeakHour(result.data.peakHour)
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [period])

  const heatmapMatrix = useMemo(() => {
    const matrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))
    let maxCount = 0

    data.forEach((item) => {
      matrix[item.dayOfWeek][item.hour] = item.count
      if (item.count > maxCount) {
        maxCount = item.count
      }
    })

    return { matrix, maxCount }
  }, [data])

  const getColor = (count: number, maxCount: number) => {
    if (count === 0 || maxCount === 0) {
      return theme.surfaceSubtle
    }

    const intensity = Math.max(14, Math.round((count / maxCount) * 84))
    return `color-mix(in srgb, ${theme.action} ${intensity}%, ${theme.surfaceSubtle})`
  }

  const getCellData = (day: number, hour: number) => data.find((item) => item.dayOfWeek === day && item.hour === hour)

  if (isLoading || externalLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="h-48 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      </AdminSurface>
    )
  }

  const hoveredData = hoveredCell ? getCellData(hoveredCell.day, hoveredCell.hour) : null

  return (
    <AdminSurface className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
            <FireIcon className="h-5 w-5" style={{ color: theme.action }} />
            {t('liaAnalyticsWidgets.heatmap.title')}
          </h3>
          <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
            {t('liaAnalyticsWidgets.heatmap.messagesInPeriod', { count: totalMessages.toLocaleString() })}
          </p>
        </div>
        {peakHour ? (
          <div className="text-left sm:text-right">
            <p className="text-xs" style={{ color: theme.textMuted }}>{t('liaAnalyticsWidgets.heatmap.peakHour')}</p>
            <p className="text-sm font-semibold" style={{ color: theme.action }}>
              {peakHour.day} {peakHour.hour}
            </p>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {t('liaAnalyticsWidgets.heatmap.messageShort', { count: peakHour.count })}
            </p>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="mb-1 flex">
            <div className="w-10 flex-shrink-0" />
            <div className="flex flex-1">
              {HOURS.filter((_, index) => index % 3 === 0).map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs"
                  style={{ minWidth: '24px', color: theme.textMuted }}
                >
                  {hour}h
                </div>
              ))}
            </div>
          </div>

          {days.map((day, dayIndex) => (
            <div key={day} className="mb-1 flex items-center">
              <div className="w-10 flex-shrink-0 pr-2 text-right text-xs" style={{ color: theme.textMuted }}>
                {day}
              </div>
              <div className="flex flex-1 gap-1">
                {HOURS.map((hour) => {
                  const count = heatmapMatrix.matrix[dayIndex][hour]
                  const isHovered = hoveredCell?.day === dayIndex && hoveredCell?.hour === hour

                  return (
                    <button
                      key={hour}
                      type="button"
                      aria-label={t('liaAnalyticsWidgets.heatmap.cellLabel', { day, hour, count })}
                      className="h-4 w-4 rounded-sm transition-all duration-150 sm:h-5 sm:w-5"
                      style={{
                        backgroundColor: getColor(count, heatmapMatrix.maxCount),
                        boxShadow: isHovered ? `0 0 0 2px ${theme.action}` : undefined,
                        transform: isHovered ? 'scale(1.2)' : undefined,
                      }}
                      onMouseEnter={() => setHoveredCell({ day: dayIndex, hour })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        setSelectedCell({ day: dayIndex, hour })
                        setIsModalOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hoveredCell ? (
        <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: theme.surfaceSubtle }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.text }}>
                {t('liaAnalyticsWidgets.heatmap.cellTime', { day: days[hoveredCell.day], hour: hoveredCell.hour })}
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {t('liaAnalyticsWidgets.heatmap.messages', { count: heatmapMatrix.matrix[hoveredCell.day][hoveredCell.hour] })}
              </p>
            </div>
            {hoveredData?.avgResponseTime ? (
              <div className="text-right">
                <p className="text-xs" style={{ color: theme.textMuted }}>{t('liaAnalyticsWidgets.heatmap.avgTime')}</p>
                <p className="text-sm font-semibold" style={{ color: theme.action }}>
                  {Math.round(hoveredData.avgResponseTime)}ms
                </p>
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-xs" style={{ color: theme.action }}>
            {t('liaAnalyticsWidgets.heatmap.clickHint')}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs italic" style={{ color: theme.textSubtle }}>
          {t('liaAnalyticsWidgets.heatmap.legendHint')}
        </p>
        <div className="flex items-center gap-1 text-xs" style={{ color: theme.textMuted }}>
          <span>{t('liaAnalyticsWidgets.heatmap.less')}</span>
          {[0, 18, 34, 50, 68, 84].map((intensity) => (
            <div
              key={intensity}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: intensity === 0 ? theme.surfaceSubtle : `color-mix(in srgb, ${theme.action} ${intensity}%, ${theme.surfaceSubtle})` }}
            />
          ))}
          <span>{t('liaAnalyticsWidgets.heatmap.more')}</span>
        </div>
      </div>

      {selectedCell ? (
        <HeatmapDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCell(null)
          }}
          dayOfWeek={selectedCell.day}
          hour={selectedCell.hour}
          period={period}
        />
      ) : null}
    </AdminSurface>
  )
}
