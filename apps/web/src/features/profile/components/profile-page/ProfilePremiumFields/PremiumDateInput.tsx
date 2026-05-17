'use client'

import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useMotionSafe } from '@/lib/utils/motion'
import { PremiumDateCalendar } from './PremiumDateCalendar'
import { usePremiumDateInput } from './usePremiumDateInput'
import type { PremiumDateInputProps } from './types'

export function PremiumDateInput({
  label,
  value,
  onChange,
  min = '1900-01-01',
  max,
  colors,
}: PremiumDateInputProps) {
  const { interfaceTransition } = useMotionSafe()
  const dateInput = usePremiumDateInput({ value, onChange, min, max })
  const isActive = dateInput.focused || dateInput.open

  return (
    <motion.div ref={dateInput.rootRef} className="relative group" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={interfaceTransition}>
      <motion.div className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent 50%, ${colors.accent}20)` }} animate={{ opacity: isActive ? 1 : 0 }} />
      <div className="relative rounded-2xl overflow-hidden transition-all duration-300 ease-out" style={{ boxShadow: isActive ? `0 0 30px ${colors.accent}26` : 'none' }}>
        <div className="absolute inset-0 transition-all duration-300" style={{ backgroundColor: isActive ? colors.bgSecondary : `${colors.bgSecondary}cc` }} />
        <div className="absolute inset-0 rounded-2xl border-2 transition-all duration-300" style={{ borderColor: isActive ? `${colors.accent}80` : colors.border }} />
        <div className="relative flex items-center">
          <div className="pl-5 flex-shrink-0 transition-transform duration-200" style={{ color: isActive ? colors.accent : colors.textSecondary, transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="relative flex-1 py-5 px-4">
            <label className="absolute left-4 top-2 pointer-events-none text-[11px] font-medium tracking-wide" style={{ color: isActive ? colors.accent : colors.textSecondary }}>
              {label}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dateInput.displayValue}
              onChange={event => dateInput.handleDisplayChange(event.target.value)}
              onFocus={() => dateInput.setFocused(true)}
              onBlur={() => dateInput.setFocused(false)}
              placeholder="dd/mm/aaaa"
              className="w-full bg-transparent pt-4 text-base font-medium focus:outline-none placeholder:text-current placeholder:opacity-50"
              style={{ color: colors.text }}
            />
          </div>
          <button type="button" onClick={() => dateInput.setOpen(prev => !prev)} className="pr-5 transition-transform duration-200 hover:scale-110 focus:outline-none" style={{ color: dateInput.open ? colors.accent : colors.textSecondary }} aria-label={label}>
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>
      {dateInput.open ? (
        <PremiumDateCalendar
          calendarDays={dateInput.calendarDays}
          colors={colors}
          max={max}
          min={min}
          monthLabel={dateInput.monthLabel}
          value={value}
          viewDate={dateInput.viewDate}
          onChangeMonth={dateInput.changeMonth}
          onDaySelect={dateInput.handleDaySelect}
        />
      ) : null}
    </motion.div>
  )
}
