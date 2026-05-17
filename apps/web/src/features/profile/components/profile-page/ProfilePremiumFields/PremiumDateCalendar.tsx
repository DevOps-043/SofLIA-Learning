'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isDateWithinRange, toDateOnly } from './date-utils'
import type { PremiumDateInputProps } from './types'

interface PremiumDateCalendarProps {
  calendarDays: Date[]
  colors: PremiumDateInputProps['colors']
  max?: string
  min?: string
  monthLabel: string
  value: string
  viewDate: Date
  onChangeMonth: (offset: number) => void
  onDaySelect: (date: Date) => void
}

export function PremiumDateCalendar({
  calendarDays,
  colors,
  max,
  min,
  monthLabel,
  value,
  viewDate,
  onChangeMonth,
  onDaySelect,
}: PremiumDateCalendarProps) {
  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-[320px] rounded-2xl border p-4 shadow-2xl" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.text }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold capitalize">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onChangeMonth(-1)} className="rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: colors.textSecondary }} aria-label="Mes anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onChangeMonth(1)} className="rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: colors.textSecondary }} aria-label="Mes siguiente">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase" style={{ color: colors.textSecondary }}>
        {['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sa'].map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const dateOnly = toDateOnly(day)
          const isCurrentMonth = day.getMonth() === viewDate.getMonth()
          const isSelected = value === dateOnly
          const isDisabled = !isDateWithinRange(dateOnly, min, max)

          return (
            <button
              key={dateOnly}
              type="button"
              onClick={() => onDaySelect(day)}
              disabled={isDisabled}
              className="h-9 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{
                backgroundColor: isSelected ? colors.accent : 'transparent',
                color: isSelected ? colors.primary : isCurrentMonth ? colors.text : colors.textSecondary,
              }}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
