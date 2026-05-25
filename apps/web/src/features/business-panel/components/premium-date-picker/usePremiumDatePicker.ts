import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  formatDisplayDate,
  formatIsoDate,
  getCalendarDays,
  getInitialViewDate,
  getMonthLabel,
  getWeekdayLabels,
  isDateOutsideBounds,
} from './date-picker-utils'
import type { DatePickerViewDate, PremiumDatePickerProps } from './types'

interface UsePremiumDatePickerArgs extends Pick<PremiumDatePickerProps, 'value' | 'onChange' | 'minDate' | 'maxDate'> {
  locale: string
}

export function usePremiumDatePicker({
  locale,
  maxDate,
  minDate,
  onChange,
  value,
}: UsePremiumDatePickerArgs) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState<DatePickerViewDate>(() => getInitialViewDate(value))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const isDateDisabled = (date: Date) => isDateOutsideBounds(date, minDate, maxDate)
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()
  const isSelected = (date: Date) => Boolean(value) && date.toDateString() === new Date(`${value}T00:00:00`).toDateString()

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date)) return
    onChange(formatIsoDate(date))
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setViewDate((current) => (
      current.month === 0 ? { year: current.year - 1, month: 11 } : { ...current, month: current.month - 1 }
    ))
  }

  const handleNextMonth = () => {
    setViewDate((current) => (
      current.month === 11 ? { year: current.year + 1, month: 0 } : { ...current, month: current.month + 1 }
    ))
  }

  const handleClear = (event: MouseEvent) => {
    event.stopPropagation()
    onChange('')
  }

  const handleToday = () => {
    const today = new Date()
    if (!isDateDisabled(today)) handleSelectDate(today)
  }

  return {
    calendarDays: useMemo(() => getCalendarDays(viewDate), [viewDate]),
    containerRef,
    displayValue: value ? formatDisplayDate(value, locale) : '',
    handleClear,
    handleNextMonth,
    handlePrevMonth,
    handleSelectDate,
    handleToday,
    isDateDisabled,
    isOpen,
    isSelected,
    isToday,
    monthLabel: getMonthLabel(viewDate, locale),
    setIsOpen,
    viewDate,
    weekdayLabels: useMemo(() => getWeekdayLabels(locale), [locale]),
  }
}
