'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildCalendarDays,
  formatDateForDisplay,
  isDateWithinRange,
  parseDateOnly,
  parseDisplayDate,
  toDateOnly,
} from './date-utils'

export function usePremiumDateInput({
  value,
  onChange,
  min,
  max,
}: {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
}) {
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState(formatDateForDisplay(value))
  const selectedDate = useMemo(() => parseDateOnly(value), [value])
  const maxDate = useMemo(() => (max ? parseDateOnly(max) : null), [max])
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewDate, setViewDate] = useState(() => selectedDate || maxDate || new Date())

  useEffect(() => {
    setDisplayValue(formatDateForDisplay(value))
    if (selectedDate) setViewDate(selectedDate)
  }, [selectedDate, value])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const monthLabel = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate)
  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  const handleDisplayChange = (nextValue: string) => {
    setDisplayValue(nextValue)
    if (!nextValue.trim()) {
      onChange('')
      return
    }

    const parsedValue = parseDisplayDate(nextValue)
    if (parsedValue && isDateWithinRange(parsedValue, min, max)) onChange(parsedValue)
  }

  const changeMonth = (offset: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const handleDaySelect = (date: Date) => {
    const dateOnly = toDateOnly(date)
    if (!isDateWithinRange(dateOnly, min, max)) return

    onChange(dateOnly)
    setDisplayValue(formatDateForDisplay(dateOnly))
    setOpen(false)
  }

  return {
    calendarDays,
    changeMonth,
    displayValue,
    focused,
    handleDaySelect,
    handleDisplayChange,
    monthLabel,
    open,
    rootRef,
    setFocused,
    setOpen,
    viewDate,
  }
}
