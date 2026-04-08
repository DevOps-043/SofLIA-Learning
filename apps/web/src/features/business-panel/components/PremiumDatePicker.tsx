'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

interface PremiumDatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  className?: string
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function PremiumDatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate,
  maxDate,
  disabled = false,
  className = '',
}: PremiumDatePickerProps) {
  const theme = useBusinessPanelTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const date = new Date(`${value}T00:00:00`)
      return { year: date.getFullYear(), month: date.getMonth() }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month)
    const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month)
    const daysInPrevMonth = getDaysInMonth(viewDate.year, viewDate.month - 1)

    const days: { day: number; month: 'prev' | 'current' | 'next'; date: Date }[] = []

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const day = daysInPrevMonth - i
      const date = new Date(viewDate.year, viewDate.month - 1, day)
      days.push({ day, month: 'prev', date })
    }

    for (let i = 1; i <= daysInMonth; i += 1) {
      const date = new Date(viewDate.year, viewDate.month, i)
      days.push({ day: i, month: 'current', date })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i += 1) {
      const date = new Date(viewDate.year, viewDate.month + 1, i)
      days.push({ day: i, month: 'next', date })
    }

    return days
  }

  const isDateDisabled = (date: Date) => {
    if (minDate) {
      const min = new Date(minDate)
      min.setHours(0, 0, 0, 0)
      if (date < min) {
        return true
      }
    }

    if (maxDate) {
      const max = new Date(maxDate)
      max.setHours(23, 59, 59, 999)
      if (date > max) {
        return true
      }
    }

    return false
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    if (!value) {
      return false
    }

    const selected = new Date(`${value}T00:00:00`)
    return date.toDateString() === selected.toDateString()
  }

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date)) {
      return
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    onChange(`${year}-${month}-${day}`)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }

      return { ...prev, month: prev.month - 1 }
    })
  }

  const handleNextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }

      return { ...prev, month: prev.month + 1 }
    })
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onChange('')
  }

  const handleToday = () => {
    const today = new Date()
    if (!isDateDisabled(today)) {
      handleSelectDate(today)
    }
  }

  const formatDisplayDate = () => {
    if (!value) {
      return ''
    }

    const date = new Date(`${value}T00:00:00`)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const calendarDays = generateCalendarDays()

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileTap={{ scale: 0.98 }}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        style={{
          backgroundColor: theme.inputBg,
          borderColor: isOpen ? theme.primaryColor : theme.borderColor,
          boxShadow: isOpen ? `0 0 0 3px ${theme.primaryColor}20` : 'none',
        }}
      >
        <Calendar className="h-5 w-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
        <span
          className={`flex-1 ${value ? '' : 'opacity-50'}`}
          style={{ color: value ? theme.textColor : theme.mutedTextColor }}
        >
          {value ? formatDisplayDate() : placeholder}
        </span>
        {value && !disabled ? (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            className="rounded-lg p-1 transition-colors"
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = theme.hoverBg
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X className="h-4 w-4" style={{ color: theme.subtextColor }} />
          </motion.div>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute left-0 top-full z-50 mt-2 min-w-[320px] rounded-2xl border p-4 shadow-2xl"
            style={{
              backgroundColor: theme.panelBg,
              borderColor: theme.borderColor,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.primaryColor}20`,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <motion.button
                type="button"
                onClick={handlePrevMonth}
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                onMouseEnter={event => {
                  event.currentTarget.style.backgroundColor = theme.hoverBg
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <ChevronLeft className="h-5 w-5" style={{ color: theme.textColor }} />
              </motion.button>

              <motion.div
                key={`${viewDate.year}-${viewDate.month}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <span className="text-lg font-bold" style={{ color: theme.textColor }}>
                  {MONTHS[viewDate.month]}
                </span>
                <span className="ml-2 font-medium" style={{ color: theme.subtextColor }}>
                  {viewDate.year}
                </span>
              </motion.div>

              <motion.button
                type="button"
                onClick={handleNextMonth}
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                onMouseEnter={event => {
                  event.currentTarget.style.backgroundColor = theme.hoverBg
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <ChevronRight className="h-5 w-5" style={{ color: theme.textColor }} />
              </motion.button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className="flex h-8 items-center justify-center text-xs font-medium"
                  style={{ color: index === 0 ? theme.dangerColor : theme.mutedTextColor }}
                >
                  {day}
                </div>
              ))}
            </div>

            <motion.div
              key={`${viewDate.year}-${viewDate.month}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-7 gap-1"
            >
              {calendarDays.map((item, index) => {
                const isDayDisabled = isDateDisabled(item.date)
                const isDayToday = isToday(item.date)
                const isDaySelected = isSelected(item.date)
                const isOtherMonth = item.month !== 'current'

                return (
                  <motion.button
                    key={`${item.date.toISOString()}-${index}`}
                    type="button"
                    onClick={() => handleSelectDate(item.date)}
                    disabled={isDayDisabled}
                    whileHover={!isDayDisabled ? { scale: 1.1 } : undefined}
                    whileTap={!isDayDisabled ? { scale: 0.9 } : undefined}
                    className={`
                      relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isDayDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}
                      ${isOtherMonth ? 'opacity-30' : ''}
                    `}
                    style={{
                      backgroundColor: isDaySelected
                        ? theme.primaryColor
                        : isDayToday
                          ? `${theme.primaryColor}20`
                          : 'transparent',
                      color: isDaySelected
                        ? theme.onPrimaryColor
                        : isDayToday
                          ? theme.primaryColor
                          : theme.textColor,
                      boxShadow: isDaySelected ? `0 4px 15px ${theme.primaryColor}40` : 'none',
                    }}
                    onMouseEnter={event => {
                      if (!isDayDisabled && !isDaySelected && !isDayToday) {
                        event.currentTarget.style.backgroundColor = theme.hoverBg
                      }
                    }}
                    onMouseLeave={event => {
                      if (!isDayDisabled && !isDaySelected && !isDayToday) {
                        event.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {item.day}
                    {isDayToday && !isDaySelected ? (
                      <motion.div
                        layoutId="today-indicator"
                        className="absolute bottom-1 h-1 w-1 rounded-full"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                    ) : null}
                  </motion.button>
                )
              })}
            </motion.div>

            <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: theme.borderColor }}>
              <motion.button
                type="button"
                onClick={() => onChange('')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: theme.subtextColor }}
                onMouseEnter={event => {
                  event.currentTarget.style.backgroundColor = theme.hoverBg
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Limpiar
              </motion.button>
              <motion.button
                type="button"
                onClick={handleToday}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: `${theme.accentColor}20`,
                  color: theme.accentColor,
                }}
              >
                Hoy
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
