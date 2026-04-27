'use client'

import { cn } from '@/shared/utils/cn'
import type { BusinessUserAnalyticsCalendarCell } from '@/features/business-panel/types/business-user-analytics.types'

interface BusinessUserAnalyticsHeatmapProps {
  cells: BusinessUserAnalyticsCalendarCell[]
  locale: string
  t: (key: string, values?: Record<string, unknown>) => string
}

const LEVEL_CLASSES = [
  'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-white/10',
  'bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900',
  'bg-emerald-300 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-800',
  'bg-emerald-500 dark:bg-emerald-600 border-emerald-500 dark:border-emerald-600',
  'bg-emerald-700 dark:bg-emerald-400 border-emerald-700 dark:border-emerald-400',
] as const

export function BusinessUserAnalyticsHeatmap({
  cells,
  locale,
  t,
}: BusinessUserAnalyticsHeatmapProps) {
  const sortedCells = [...cells].sort((a, b) => a.weekIndex - b.weekIndex || a.dayIndex - b.dayIndex)
  const weekCount = Math.max(1, ...sortedCells.map((cell) => cell.weekIndex + 1))
  const monthLabels = buildMonthLabels(sortedCells, locale)

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[720px]">
        <div
          className="mb-2 ml-12 grid text-xs text-gray-500 dark:text-gray-400"
          style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
        >
          {monthLabels.map((month) => (
            <span
              key={`${month.label}-${month.weekIndex}`}
              style={{ gridColumnStart: month.weekIndex + 1 }}
            >
              {month.label}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="grid h-[104px] w-10 grid-rows-7 gap-1 text-[10px] text-gray-500 dark:text-gray-400">
            <span />
            <span>{t('analytics.heatmap.weekdays.mon')}</span>
            <span />
            <span>{t('analytics.heatmap.weekdays.wed')}</span>
            <span />
            <span>{t('analytics.heatmap.weekdays.fri')}</span>
            <span />
          </div>

          <div
            className="grid grid-flow-col grid-rows-7 gap-1"
            style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
          >
            {sortedCells.map((cell) => (
              <div
                key={cell.date}
                className={cn(
                  'h-3 w-3 rounded-sm border transition-transform hover:scale-125',
                  LEVEL_CLASSES[cell.level],
                )}
                title={t('analytics.heatmap.cellTitle', {
                  date: formatDate(cell.date, locale),
                  count: cell.value,
                })}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{t('analytics.heatmap.less')}</span>
          {LEVEL_CLASSES.map((className, index) => (
            <span
              key={className}
              className={cn('h-3 w-3 rounded-sm border', className)}
              aria-label={t('analytics.heatmap.levelLabel', { level: index })}
            />
          ))}
          <span>{t('analytics.heatmap.more')}</span>
        </div>
      </div>
    </div>
  )
}

function buildMonthLabels(cells: BusinessUserAnalyticsCalendarCell[], locale: string) {
  const labels: Array<{ label: string; weekIndex: number }> = []
  const seenMonths = new Set<string>()

  cells.forEach((cell) => {
    if (seenMonths.has(cell.monthKey)) return
    seenMonths.add(cell.monthKey)
    labels.push({
      label: new Intl.DateTimeFormat(resolveLocale(locale), { month: 'short' }).format(new Date(`${cell.date}T00:00:00.000Z`)),
      weekIndex: cell.weekIndex,
    })
  })

  return labels
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`))
}

function resolveLocale(locale: string): string {
  if (locale === 'en') return 'en-US'
  if (locale === 'pt') return 'pt-BR'
  return 'es-MX'
}
