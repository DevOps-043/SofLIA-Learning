'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Select from '@radix-ui/react-select'
import { motion } from 'framer-motion'
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMotionSafe } from '../../../../lib/utils/motion'
import type { ProfileColorPalette } from '../../types/profile.types'

const EMPTY_SELECT_VALUE = '__empty__'

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }

  return date
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateForDisplay(value: string): string {
  const date = parseDateOnly(value)
  if (!date) {
    return ''
  }

  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear())
  ].join('/')
}

function parseDisplayDate(value: string): string | null {
  const trimmedValue = value.trim()
  const displayMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmedValue)

  if (displayMatch) {
    const day = displayMatch[1].padStart(2, '0')
    const month = displayMatch[2].padStart(2, '0')
    const year = displayMatch[3]
    const dateOnly = `${year}-${month}-${day}`
    return parseDateOnly(dateOnly) ? dateOnly : null
  }

  return parseDateOnly(trimmedValue) ? trimmedValue : null
}

function isDateWithinRange(value: string, min?: string, max?: string): boolean {
  if (!parseDateOnly(value)) {
    return false
  }

  return (!min || value >= min) && (!max || value <= max)
}

function buildCalendarDays(viewDate: Date) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const calendarStart = new Date(firstDay)
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + index)
    return date
  })
}

interface PremiumInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  icon?: JSX.Element | null
  type?: string
  placeholder?: string
  max?: string
  colors: ProfileColorPalette
}

export function PremiumInput({ label, value, onChange, icon, type = 'text', placeholder, max, colors }: PremiumInputProps) {
  const [focused, setFocused] = useState(false)
  const { interfaceTransition } = useMotionSafe()
  const hasValue = value.length > 0

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 ease-out" style={{ boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0 transition-all duration-300" style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: focused ? `${colors.accent}80` : colors.border }} />

        <div className="relative flex items-center">
          {icon ? (
            <div
              className="pl-5 flex-shrink-0 transition-transform duration-200"
              style={{
                color: focused ? colors.accent : colors.textSecondary,
                transform: focused ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {icon}
            </div>
          ) : null}

          <div className="relative flex-1 py-5 px-4">
            <motion.label
              className="absolute left-4 pointer-events-none font-medium"
              initial={false}
              animate={{
                top: focused || hasValue ? '8px' : '50%',
                y: focused || hasValue ? 0 : '-50%',
                fontSize: focused || hasValue ? '11px' : '14px',
                color: focused ? colors.accent : colors.textSecondary,
                letterSpacing: focused || hasValue ? '0.5px' : '0'
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>

            <input
              type={type}
              value={value}
              onChange={event => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={focused ? placeholder : ''}
              max={max}
              className={`w-full bg-transparent text-base font-medium focus:outline-none placeholder-white/20 ${(focused || hasValue) ? 'pt-4' : 'pt-0'}`}
              style={{ color: colors.text }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface PremiumDateInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  colors: ProfileColorPalette
}

export function PremiumDateInput({ label, value, onChange, min = '1900-01-01', max, colors }: PremiumDateInputProps) {
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const { interfaceTransition } = useMotionSafe()
  const [displayValue, setDisplayValue] = useState(formatDateForDisplay(value))
  const selectedDate = useMemo(() => parseDateOnly(value), [value])
  const maxDate = useMemo(() => (max ? parseDateOnly(max) : null), [max])
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewDate, setViewDate] = useState(() => selectedDate || maxDate || new Date())

  useEffect(() => {
    setDisplayValue(formatDateForDisplay(value))
    if (selectedDate) {
      setViewDate(selectedDate)
    }
  }, [selectedDate, value])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const monthLabel = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric'
  }).format(viewDate)
  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate])

  const handleDisplayChange = (nextValue: string) => {
    setDisplayValue(nextValue)

    if (!nextValue.trim()) {
      onChange('')
      return
    }

    const parsedValue = parseDisplayDate(nextValue)
    if (parsedValue && isDateWithinRange(parsedValue, min, max)) {
      onChange(parsedValue)
    }
  }

  const changeMonth = (offset: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const handleDaySelect = (date: Date) => {
    const dateOnly = toDateOnly(date)
    if (!isDateWithinRange(dateOnly, min, max)) {
      return
    }

    onChange(dateOnly)
    setDisplayValue(formatDateForDisplay(dateOnly))
    setOpen(false)
  }

  return (
    <motion.div ref={rootRef} className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }}
        animate={{ opacity: focused || open ? 1 : 0 }}
      />

      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 ease-out" style={{ boxShadow: focused || open ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0 transition-all duration-300" style={{ backgroundColor: focused || open ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: focused || open ? `${colors.accent}80` : colors.border }} />

        <div className="relative flex items-center">
          <div
            className="pl-5 flex-shrink-0 transition-transform duration-200"
            style={{
              color: focused || open ? colors.accent : colors.textSecondary,
              transform: focused || open ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <Calendar className="w-4 h-4" />
          </div>

          <div className="relative flex-1 py-5 px-4">
            <label className="absolute left-4 top-2 pointer-events-none text-[11px] font-medium tracking-wide" style={{ color: focused || open ? colors.accent : colors.textSecondary }}>
              {label}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={event => handleDisplayChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="dd/mm/aaaa"
              className="w-full bg-transparent pt-4 text-base font-medium focus:outline-none placeholder:text-current placeholder:opacity-50"
              style={{ color: colors.text }}
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="pr-5 transition-transform duration-200 hover:scale-110 focus:outline-none"
            style={{ color: open ? colors.accent : colors.textSecondary }}
            aria-label={label}
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="absolute bottom-full left-0 z-50 mb-2 w-[320px] rounded-2xl border p-4 shadow-2xl"
          style={{
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold capitalize">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => changeMonth(-1)} className="rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: colors.textSecondary }} aria-label="Mes anterior">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => changeMonth(1)} className="rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: colors.textSecondary }} aria-label="Mes siguiente">
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
                  onClick={() => handleDaySelect(day)}
                  disabled={isDisabled}
                  className="h-9 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: isSelected ? colors.accent : 'transparent',
                    color: isSelected ? colors.primary : isCurrentMonth ? colors.text : colors.textSecondary
                  }}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}

interface PremiumSelectOption {
  value: string
  label: string
}

interface PremiumSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: PremiumSelectOption[]
  placeholder: string
  colors: ProfileColorPalette
}

export function PremiumSelect({ label, value, onChange, options, placeholder, colors }: PremiumSelectProps) {
  const [open, setOpen] = useState(false)
  const { interfaceTransition } = useMotionSafe()

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }}
        animate={{ opacity: open ? 1 : 0 }}
      />

      <Select.Root
        value={value || EMPTY_SELECT_VALUE}
        onValueChange={nextValue => onChange(nextValue === EMPTY_SELECT_VALUE ? '' : nextValue)}
        open={open}
        onOpenChange={setOpen}
      >
        <Select.Trigger
          className="relative flex min-h-[68px] w-full items-center rounded-2xl border-2 px-5 text-left transition-all duration-300 focus:outline-none"
          style={{
            backgroundColor: open ? colors.bgSecondary : `${colors.bgSecondary}cc`,
            borderColor: open ? `${colors.accent}80` : colors.border,
            boxShadow: open ? `0 0 30px ${colors.accent}26` : 'none',
            color: colors.text
          }}
        >
          <span className="min-w-0 flex-1 pt-4">
            <span className="absolute left-5 top-3 text-[11px] font-medium tracking-wide" style={{ color: open ? colors.accent : colors.textSecondary }}>
              {label}
            </span>
            <Select.Value placeholder={placeholder} />
          </span>
          <Select.Icon asChild>
            <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" style={{ color: open ? colors.accent : colors.textSecondary }} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={8}
            className="z-50 max-h-72 overflow-hidden rounded-2xl border p-2 shadow-2xl"
            style={{
              backgroundColor: colors.bgSecondary,
              borderColor: colors.border,
              color: colors.text,
              minWidth: 'var(--radix-select-trigger-width)'
            }}
          >
            <Select.Viewport>
              <Select.Item value={EMPTY_SELECT_VALUE} className="relative flex cursor-pointer select-none items-center rounded-xl px-4 py-3 text-sm outline-none transition-colors data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10">
                <Select.ItemText>{placeholder}</Select.ItemText>
              </Select.Item>
              {options.map(option => (
                <Select.Item key={option.value} value={option.value} className="relative flex cursor-pointer select-none items-center rounded-xl px-4 py-3 text-sm outline-none transition-colors data-[highlighted]:bg-black/5 dark:data-[highlighted]:bg-white/10">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-4" style={{ color: colors.accent }}>
                    <Check className="w-4 h-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </motion.div>
  )
}

interface PremiumTextareaProps {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
  rows?: number
  colors: ProfileColorPalette
}

export function PremiumTextarea({
  label,
  value,
  onChange,
  maxLength = 500,
  rows = 4,
  colors
}: PremiumTextareaProps) {
  const [focused, setFocused] = useState(false)
  const { interfaceTransition } = useMotionSafe()
  const charCount = value.length
  const isNearLimit = charCount > maxLength * 0.8

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

      <div className="relative rounded-2xl overflow-hidden transition-all duration-300" style={{ boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0" style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-colors duration-300" style={{ borderColor: focused ? `${colors.accent}80` : colors.border }} />

        <div className="relative p-5">
          <motion.label className="block mb-3 font-medium text-xs tracking-wide" animate={{ color: focused ? colors.accent : colors.textSecondary }}>
            {label}
          </motion.label>

          <textarea
            value={value}
            onChange={event => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={rows}
            maxLength={maxLength}
            className="w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed"
            style={{ color: colors.text }}
          />

          <div className="flex justify-end mt-3">
            <span className="text-xs" style={{ color: isNearLimit ? colors.warning : colors.textSecondary }}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface PremiumPasswordProps {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
  error?: string
  colors: ProfileColorPalette
}

export function PremiumPassword({ label, value, onChange, show, onToggle, error, colors }: PremiumPasswordProps) {
  const [focused, setFocused] = useState(false)
  const { interfaceTransition } = useMotionSafe()
  const hasValue = value.length > 0

  return (
    <motion.div className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${(error ? colors.error : colors.accent)}40, transparent 50%, ${(error ? colors.error : colors.accent)}20)` }}
        animate={{ opacity: focused ? 1 : 0 }}
      />

      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 ease-out" style={{ boxShadow: focused ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0 transition-all duration-300" style={{ backgroundColor: focused ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: error ? `${colors.error}60` : focused ? `${colors.accent}80` : colors.border }} />

        <div className="relative flex items-center">
          <div className="relative flex-1 py-5 px-4">
            <motion.label
              className="absolute left-4 pointer-events-none font-medium"
              initial={false}
              animate={{
                top: focused || hasValue ? '8px' : '50%',
                y: focused || hasValue ? 0 : '-50%',
                fontSize: focused || hasValue ? '11px' : '14px',
                color: error ? colors.error : focused ? colors.accent : colors.textSecondary
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>

            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={event => onChange(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={`w-full bg-transparent text-base font-medium focus:outline-none ${(focused || hasValue) ? 'pt-4' : 'pt-0'}`}
              style={{ color: colors.text }}
            />
          </div>

          <button type="button" onClick={onToggle} className="pr-5 text-sm font-medium" style={{ color: colors.textSecondary }}>
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-sm" style={{ color: colors.error }}>
          {error}
        </p>
      ) : null}
    </motion.div>
  )
}
