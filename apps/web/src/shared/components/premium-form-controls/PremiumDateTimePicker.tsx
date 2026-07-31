'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
} from 'lucide-react'

import styles from './PremiumFormControls.module.css'
import {
  getPremiumControlStyle,
  type PremiumControlPalette,
} from './types'
import { useAnchoredPopover } from './useAnchoredPopover'

type PickerMode = 'date' | 'datetime'
type PickerView = 'calendar' | 'months' | 'years'

interface PremiumDateTimePickerProps {
  ariaLabel: string
  disabled?: boolean
  id?: string
  max?: string
  min?: string
  mode?: PickerMode
  onChange: (value: string) => void
  palette: PremiumControlPalette
  placeholder: string
  value: string
}

const DAY_CELL_COUNT = 42
const MINIMUM_YEAR = 1900

function parseValue(value: string): Date | null {
  if (!value) return null
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null
  const [hours = 0, minutes = 0] = (timePart ?? '').split(':').map(Number)
  const parsed = new Date(year, month - 1, day, hours, minutes)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateValue(date: Date, mode: PickerMode): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (mode === 'date') return `${year}-${month}-${day}`
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function PremiumDateTimePicker({
  ariaLabel,
  disabled = false,
  id,
  max,
  min,
  mode = 'date',
  onChange,
  palette,
  placeholder,
  value,
}: PremiumDateTimePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const selectedDate = useMemo(() => parseValue(value), [value])
  const minDate = useMemo(() => parseValue(min ?? ''), [min])
  const maxDate = useMemo(() => parseValue(max ?? ''), [max])
  const initialDate = selectedDate ?? minDate ?? new Date()
  const [isOpen, setIsOpen] = useState(false)
  const [pickerView, setPickerView] = useState<PickerView>('calendar')
  const [draftDate, setDraftDate] = useState(initialDate)
  const [viewDate, setViewDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  )
  const locale = 'es-MX'
  const controlStyle = getPremiumControlStyle(palette)
  const { position, updatePosition } = useAnchoredPopover({
    isOpen,
    popoverRef,
    preferredHeight: mode === 'datetime' ? 485 : 405,
    preferredWidth: mode === 'datetime' ? 360 : 336,
    triggerRef,
  })

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) =>
        new Intl.DateTimeFormat(locale, { month: 'short' }).format(
          new Date(2026, month, 1),
        ),
      ),
    [],
  )
  const weekdayNames = useMemo(() => {
    const sunday = new Date(2026, 0, 4)
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(
        new Date(2026, 0, sunday.getDate() + index),
      ),
    )
  }, [])
  const availableYears = useMemo(() => {
    const minimum = minDate?.getFullYear() ?? MINIMUM_YEAR
    const maximum = maxDate?.getFullYear() ?? new Date().getFullYear() + 10
    return Array.from(
      { length: Math.max(1, maximum - minimum + 1) },
      (_, index) => maximum - index,
    )
  }, [maxDate, minDate])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const offset = new Date(year, month, 1).getDay()
    return Array.from(
      { length: DAY_CELL_COUNT },
      (_, index) => new Date(year, month, index - offset + 1),
    )
  }, [viewDate])

  useEffect(() => {
    if (!isOpen) return
    const next = selectedDate ?? minDate ?? new Date()
    setDraftDate(next)
    setViewDate(new Date(next.getFullYear(), next.getMonth(), 1))
    setPickerView('calendar')
    const focusFrame = window.requestAnimationFrame(() => {
      popoverRef.current?.focus()
    })

    const handlePointerDown = (event: MouseEvent) => {
      const node = event.target as Node
      if (
        !triggerRef.current?.contains(node) &&
        !popoverRef.current?.contains(node)
      ) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, minDate, selectedDate])

  function isDateDisabled(date: Date) {
    const day = startOfDay(date)
    if (minDate && day < startOfDay(minDate)) return true
    if (maxDate && day > startOfDay(maxDate)) return true
    return false
  }

  function selectDay(date: Date) {
    if (isDateDisabled(date)) return
    const next = new Date(date)
    next.setHours(draftDate.getHours(), draftDate.getMinutes(), 0, 0)
    setDraftDate(next)
    setViewDate(new Date(next.getFullYear(), next.getMonth(), 1))
    if (mode === 'date') {
      onChange(formatDateValue(next, mode))
      setIsOpen(false)
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }

  function adjustTime(part: 'hour' | 'minute', amount: number) {
    setDraftDate((current) => {
      const next = new Date(current)
      if (part === 'hour') next.setHours(next.getHours() + amount)
      else next.setMinutes(next.getMinutes() + amount * 5)
      return next
    })
  }

  function setPeriod(period: 'am' | 'pm') {
    setDraftDate((current) => {
      const next = new Date(current)
      const hour = current.getHours()
      if (period === 'am' && hour >= 12) next.setHours(hour - 12)
      if (period === 'pm' && hour < 12) next.setHours(hour + 12)
      return next
    })
  }

  function applyDateTime() {
    onChange(formatDateValue(draftDate, mode))
    setIsOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const displayValue = selectedDate
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        hour: mode === 'datetime' ? '2-digit' : undefined,
        hour12: mode === 'datetime',
        minute: mode === 'datetime' ? '2-digit' : undefined,
        month: 'short',
        year: 'numeric',
      }).format(selectedDate)
    : placeholder
  const hour12 = draftDate.getHours() % 12 || 12
  const period = draftDate.getHours() >= 12 ? 'pm' : 'am'

  return (
    <div className={styles.controlRoot} style={controlStyle}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <span className={styles.leadingIcon}>
          <CalendarDays aria-hidden="true" />
        </span>
        <span
          className={selectedDate ? styles.triggerValue : styles.triggerPlaceholder}
        >
          {displayValue}
        </span>
        {selectedDate ? (
          <span
            aria-label="Borrar fecha"
            className={styles.clearIcon}
            onClick={(event) => {
              event.stopPropagation()
              onChange('')
            }}
            role="button"
          >
            <X aria-hidden="true" />
          </span>
        ) : (
          <span
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          >
            <ChevronDown aria-hidden="true" />
          </span>
        )}
      </button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-label={ariaLabel}
              className={`${styles.popover} ${styles.calendarPopover}`}
              onAnimationEnd={updatePosition}
              ref={popoverRef}
              role="dialog"
              tabIndex={-1}
              style={{
                ...controlStyle,
                left: position?.left ?? -9999,
                maxHeight: position?.maxHeight ?? 485,
                top: position?.top ?? -9999,
                width: position?.width ?? 336,
              }}
            >
              <div className={styles.calendarHeader}>
                <button
                  aria-label="Mes anterior"
                  className={styles.calendarNavigation}
                  onClick={() =>
                    setViewDate(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() - 1,
                          1,
                        ),
                    )
                  }
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  className={styles.calendarViewButton}
                  onClick={() =>
                    setPickerView((current) =>
                      current === 'months' ? 'calendar' : 'months',
                    )
                  }
                  type="button"
                >
                  {monthNames[viewDate.getMonth()]}
                </button>
                <button
                  className={styles.calendarViewButton}
                  onClick={() =>
                    setPickerView((current) =>
                      current === 'years' ? 'calendar' : 'years',
                    )
                  }
                  type="button"
                >
                  {viewDate.getFullYear()}
                </button>
                <button
                  aria-label="Mes siguiente"
                  className={styles.calendarNavigation}
                  onClick={() =>
                    setViewDate(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() + 1,
                          1,
                        ),
                    )
                  }
                  type="button"
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>

              {pickerView === 'calendar' ? (
                <>
                  <div className={styles.weekdayGrid}>
                    {weekdayNames.map((weekday, index) => (
                      <span className={styles.weekday} key={`${weekday}-${index}`}>
                        {weekday}
                      </span>
                    ))}
                  </div>
                  <div className={styles.dayGrid}>
                    {calendarDays.map((date) => {
                      const isOutside = date.getMonth() !== viewDate.getMonth()
                      const isSelected =
                        draftDate.toDateString() === date.toDateString()
                      const isToday = new Date().toDateString() === date.toDateString()
                      return (
                        <button
                          className={`${styles.day} ${
                            isOutside ? styles.dayOutside : ''
                          } ${isToday ? styles.dayToday : ''} ${
                            isSelected ? styles.daySelected : ''
                          }`}
                          disabled={isDateDisabled(date)}
                          key={date.toISOString()}
                          onClick={() => selectDay(date)}
                          type="button"
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : null}

              {pickerView === 'months' ? (
                <div className={styles.viewGrid}>
                  {monthNames.map((month, index) => (
                    <button
                      className={`${styles.viewOption} ${
                        viewDate.getMonth() === index
                          ? styles.viewOptionSelected
                          : ''
                      }`}
                      key={month}
                      onClick={() => {
                        setViewDate(
                          (current) =>
                            new Date(current.getFullYear(), index, 1),
                        )
                        setPickerView('calendar')
                      }}
                      type="button"
                    >
                      {month}
                    </button>
                  ))}
                </div>
              ) : null}

              {pickerView === 'years' ? (
                <div className={styles.viewGrid}>
                  {availableYears.map((year) => (
                    <button
                      className={`${styles.viewOption} ${
                        viewDate.getFullYear() === year
                          ? styles.viewOptionSelected
                          : ''
                      }`}
                      key={year}
                      onClick={() => {
                        setViewDate(
                          (current) => new Date(year, current.getMonth(), 1),
                        )
                        setPickerView('calendar')
                      }}
                      type="button"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : null}

              {mode === 'datetime' ? (
                <div className={styles.timeSection}>
                  <div className={styles.timeControl}>
                    <span className={styles.timeLabel}>Hora</span>
                    <div className={styles.timeStepper}>
                      <button
                        aria-label="Restar una hora"
                        className={styles.timeStepButton}
                        onClick={() => adjustTime('hour', -1)}
                        type="button"
                      >
                        <Minus aria-hidden="true" />
                      </button>
                      <span className={styles.timeValue}>
                        {String(hour12).padStart(2, '0')}
                      </span>
                      <button
                        aria-label="Sumar una hora"
                        className={styles.timeStepButton}
                        onClick={() => adjustTime('hour', 1)}
                        type="button"
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <span className={styles.timeSeparator}>:</span>
                  <div className={styles.timeControl}>
                    <span className={styles.timeLabel}>Minutos</span>
                    <div className={styles.timeStepper}>
                      <button
                        aria-label="Restar cinco minutos"
                        className={styles.timeStepButton}
                        onClick={() => adjustTime('minute', -1)}
                        type="button"
                      >
                        <Minus aria-hidden="true" />
                      </button>
                      <span className={styles.timeValue}>
                        {String(draftDate.getMinutes()).padStart(2, '0')}
                      </span>
                      <button
                        aria-label="Sumar cinco minutos"
                        className={styles.timeStepButton}
                        onClick={() => adjustTime('minute', 1)}
                        type="button"
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className={styles.periodToggle}>
                    {(['am', 'pm'] as const).map((option) => (
                      <button
                        aria-pressed={period === option}
                        className={
                          period === option
                            ? styles.periodButtonActive
                            : styles.periodButton
                        }
                        key={option}
                        onClick={() => setPeriod(option)}
                        type="button"
                      >
                        {option.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <footer className={styles.calendarFooter}>
                <button
                  className={styles.calendarTextButton}
                  onClick={() => {
                    onChange('')
                    setIsOpen(false)
                  }}
                  type="button"
                >
                  Borrar
                </button>
                <div className={styles.calendarFooterActions}>
                  <button
                    className={styles.calendarTextButton}
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  {mode === 'datetime' ? (
                    <button
                      className={styles.calendarApplyButton}
                      onClick={applyDateTime}
                      type="button"
                    >
                      Aplicar
                    </button>
                  ) : null}
                </div>
              </footer>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
