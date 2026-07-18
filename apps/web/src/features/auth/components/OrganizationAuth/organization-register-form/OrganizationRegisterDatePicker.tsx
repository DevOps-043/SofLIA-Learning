'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { UseFormRegisterReturn } from 'react-hook-form'
import type { OrganizationAuthPalette } from '../organization-auth.styles'

interface OrganizationRegisterDatePickerProps {
  id: string
  label: string
  value: string | null | undefined
  onChange: (value: string) => void
  registration: UseFormRegisterReturn
  palette: OrganizationAuthPalette
  error?: string
  maxDate?: Date
}

type PickerView = 'calendar' | 'months' | 'years'

const DAY_CELL_COUNT = 42
const MINIMUM_BIRTH_YEAR = 1900

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function OrganizationRegisterDatePicker({
  id,
  label,
  value,
  onChange,
  registration,
  palette,
  error,
  maxDate = new Date(),
}: OrganizationRegisterDatePickerProps) {
  const { i18n, t } = useTranslation('common')
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedDate = useMemo(() => parseIsoDate(value), [value])
  const initialViewDate = selectedDate || new Date(maxDate.getFullYear() - 25, maxDate.getMonth(), 1)
  const [isOpen, setIsOpen] = useState(false)
  const [pickerView, setPickerView] = useState<PickerView>('calendar')
  const [viewDate, setViewDate] = useState(
    () => new Date(initialViewDate.getFullYear(), initialViewDate.getMonth(), 1),
  )

  const locale = i18n.language || 'es'
  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) =>
        new Intl.DateTimeFormat(locale, { month: 'short' }).format(
          new Date(2024, month, 1),
        ),
      ),
    [locale],
  )
  const weekdayNames = useMemo(() => {
    const sunday = new Date(2024, 0, 7)
    return Array.from({ length: 7 }, (_, day) =>
      new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(
        new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + day),
      ),
    )
  }, [locale])
  const availableYears = useMemo(
    () =>
      Array.from(
        { length: maxDate.getFullYear() - MINIMUM_BIRTH_YEAR + 1 },
        (_, index) => maxDate.getFullYear() - index,
      ),
    [maxDate],
  )

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setPickerView('calendar')
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setPickerView('calendar')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [selectedDate])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDayOffset = new Date(year, month, 1).getDay()
    return Array.from({ length: DAY_CELL_COUNT }, (_, index) => {
      const day = index - firstDayOffset + 1
      return new Date(year, month, day)
    })
  }, [viewDate])

  const displayValue = selectedDate
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(selectedDate)
    : t('datePicker.placeholder')

  function handleSelectDate(date: Date) {
    if (date > maxDate || date.getFullYear() < MINIMUM_BIRTH_YEAR) return
    onChange(formatIsoDate(date))
    setIsOpen(false)
    setPickerView('calendar')
  }

  function moveMonth(offset: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <div ref={containerRef} className="space-y-1.5">
      <label
        className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
        htmlFor={`${id}-trigger`}
        style={{ color: palette.textColor }}
      >
        {label}
      </label>

      <input id={id} type="hidden" value={value || ''} {...registration} readOnly />

      <div className="relative">
        <motion.button
          id={`${id}-trigger`}
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => {
            setIsOpen((open) => !open)
            setPickerView('calendar')
          }}
          className="flex h-[46px] w-full items-center gap-3 rounded-xl border px-4 text-left text-sm transition-all"
          style={{
            backgroundColor: palette.inputBgColor,
            borderColor: isOpen ? palette.focusColor : error ? 'var(--color-error)' : palette.borderColor,
            boxShadow: isOpen
              ? `0 0 0 3px color-mix(in srgb, ${palette.focusColor} 13%, transparent)`
              : 'none',
            color: selectedDate
              ? palette.textColor
              : `color-mix(in srgb, ${palette.textColor} 45%, transparent)`,
          }}
          whileTap={{ scale: 0.99 }}
        >
          <CalendarDays
            className="h-4 w-4 shrink-0"
            style={{ color: isOpen ? palette.focusColor : `color-mix(in srgb, ${palette.textColor} 42%, transparent)` }}
          />
          <span className="min-w-0 flex-1 truncate capitalize">{displayValue}</span>
          {selectedDate ? (
            <motion.span
              aria-label={t('datePicker.clear')}
              className="rounded-md p-0.5"
              onClick={(event) => {
                event.stopPropagation()
                onChange('')
              }}
              role="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-3.5 w-3.5" />
            </motion.span>
          ) : (
            <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              role="dialog"
              aria-label={label}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="absolute left-0 top-full z-[80] mt-2 w-[320px] max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl border p-3 shadow-2xl backdrop-blur-xl"
              style={{
                backgroundColor: palette.cardBg,
                borderColor: `color-mix(in srgb, ${palette.textColor} 15%, transparent)`,
                boxShadow: `0 24px 60px -20px rgba(0,0,0,.72), 0 0 0 1px color-mix(in srgb, ${palette.primaryColor} 15%, transparent)`,
                color: palette.textColor,
              }}
            >
              <div className="mb-3 flex items-center gap-1">
                <motion.button
                  type="button"
                  aria-label={t('datePicker.previousMonth')}
                  className="rounded-lg p-2 transition-opacity hover:opacity-70"
                  onClick={() => moveMonth(-1)}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.button>
                <button
                  type="button"
                  className="flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold capitalize transition-opacity hover:opacity-70"
                  onClick={() => setPickerView(pickerView === 'months' ? 'calendar' : 'months')}
                >
                  {monthNames[viewDate.getMonth()]}
                </button>
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  onClick={() => setPickerView(pickerView === 'years' ? 'calendar' : 'years')}
                >
                  {viewDate.getFullYear()}
                </button>
                <motion.button
                  type="button"
                  aria-label={t('datePicker.nextMonth')}
                  className="rounded-lg p-2 transition-opacity hover:opacity-70"
                  onClick={() => moveMonth(1)}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              </div>

              {pickerView === 'calendar' ? (
                <>
                  <div className="mb-1 grid grid-cols-7">
                    {weekdayNames.map((weekday, index) => (
                      <span
                        key={`${weekday}-${index}`}
                        className="py-1 text-center text-[11px] font-semibold uppercase opacity-45"
                      >
                        {weekday}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((date) => {
                      const isCurrentMonth = date.getMonth() === viewDate.getMonth()
                      const isSelected = selectedDate?.toDateString() === date.toDateString()
                      const isDisabled = date > maxDate || date.getFullYear() < MINIMUM_BIRTH_YEAR
                      const isToday = new Date().toDateString() === date.toDateString()
                      return (
                        <motion.button
                          key={date.toISOString()}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectDate(date)}
                          className="relative flex h-9 items-center justify-center rounded-lg text-xs font-medium disabled:cursor-not-allowed disabled:opacity-20"
                          style={{
                            backgroundColor: isSelected
                              ? palette.primaryColor
                              : isToday
                                ? `color-mix(in srgb, ${palette.focusColor} 14%, transparent)`
                                : 'transparent',
                            color: isSelected ? '#fff' : palette.textColor,
                            opacity: isCurrentMonth ? 1 : 0.34,
                          }}
                          whileHover={isDisabled ? undefined : { scale: 1.08 }}
                          whileTap={isDisabled ? undefined : { scale: 0.92 }}
                        >
                          {date.getDate()}
                          {isToday && !isSelected ? (
                            <span
                              className="absolute bottom-1 h-0.5 w-0.5 rounded-full"
                              style={{ backgroundColor: palette.focusColor }}
                            />
                          ) : null}
                        </motion.button>
                      )
                    })}
                  </div>
                </>
              ) : null}

              {pickerView === 'months' ? (
                <div className="grid grid-cols-3 gap-2 py-2">
                  {monthNames.map((month, index) => (
                    <motion.button
                      key={month}
                      type="button"
                      className="rounded-xl px-2 py-3 text-xs font-medium capitalize"
                      onClick={() => {
                        setViewDate((current) => new Date(current.getFullYear(), index, 1))
                        setPickerView('calendar')
                      }}
                      style={{
                        backgroundColor:
                          viewDate.getMonth() === index
                            ? `color-mix(in srgb, ${palette.primaryColor} 20%, transparent)`
                            : `color-mix(in srgb, ${palette.textColor} 5%, transparent)`,
                        color: viewDate.getMonth() === index ? palette.focusColor : palette.textColor,
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {month}
                    </motion.button>
                  ))}
                </div>
              ) : null}

              {pickerView === 'years' ? (
                <div className="grid max-h-[250px] grid-cols-3 gap-2 overflow-y-auto py-2 pr-1 scrollbar-thin">
                  {availableYears.map((year) => (
                    <motion.button
                      key={year}
                      type="button"
                      className="flex items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium"
                      onClick={() => {
                        setViewDate((current) => new Date(year, current.getMonth(), 1))
                        setPickerView('calendar')
                      }}
                      style={{
                        backgroundColor:
                          viewDate.getFullYear() === year
                            ? `color-mix(in srgb, ${palette.primaryColor} 20%, transparent)`
                            : `color-mix(in srgb, ${palette.textColor} 5%, transparent)`,
                        color: viewDate.getFullYear() === year ? palette.focusColor : palette.textColor,
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {viewDate.getFullYear() === year ? <Check className="h-3 w-3" /> : null}
                      {year}
                    </motion.button>
                  ))}
                </div>
              ) : null}

              <div
                className="mt-3 flex items-center justify-between border-t pt-2"
                style={{ borderColor: `color-mix(in srgb, ${palette.textColor} 10%, transparent)` }}
              >
                <button
                  type="button"
                  className="rounded-lg px-2 py-1.5 text-xs font-medium opacity-60 transition-opacity hover:opacity-100"
                  onClick={() => onChange('')}
                >
                  {t('datePicker.clear')}
                </button>
                <span className="text-[11px] opacity-45">{t('datePicker.birthDateHint')}</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  )
}
