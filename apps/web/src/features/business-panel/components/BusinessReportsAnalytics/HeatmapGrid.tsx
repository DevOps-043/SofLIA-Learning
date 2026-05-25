import type { CalendarWeek } from './calendar.utils'
import { formatCalendarDate, getConnectionCalendarColor } from './calendar.utils'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'

const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const cellPitch = 18

export function HeatmapGrid({
  locale,
  monthLabels,
  theme,
  t,
  weeks,
}: {
  locale: ReportsAnalyticsLocale
  monthLabels: Array<{ weekIndex: number; label: string }>
  theme: ThemeTokens
  t: ReportsAnalyticsT
  weeks: CalendarWeek[]
}) {
  return (
    <div className="mt-5 overflow-x-auto pb-2">
      <div className="min-w-max">
        <div className="ml-10 h-5" style={{ position: 'relative', width: `${weeks.length * cellPitch}px` }}>
          {monthLabels.map((month) => (
            <span key={`${month.weekIndex}-${month.label}`} className="absolute text-[11px]" style={{ left: `${month.weekIndex * cellPitch}px`, color: theme.mutedTextColor }}>
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
                    style={{ backgroundColor: cell ? getConnectionCalendarColor(cell.level, theme) : theme.hoverBg, borderColor: theme.dividerColor }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
