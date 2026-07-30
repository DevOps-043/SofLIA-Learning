'use client'

import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useMotionSafe } from '@/lib/utils/motion'
import { PremiumDateCalendar } from './PremiumDateCalendar'
import { usePremiumDateInput } from './usePremiumDateInput'
import type { PremiumDateInputProps } from './types'
import styles from '../ProfileExperience.module.css'

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
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.field}
      data-color-mode={colors.isLightMode ? 'light' : 'dark'}
      initial={{ opacity: 0, y: 12 }}
      ref={dateInput.rootRef}
      transition={interfaceTransition}
    >
      <div className={`${styles.fieldShell} ${isActive ? styles.fieldShellActive : ''}`}>
        <div className={styles.fieldRow}>
          <span className={`${styles.fieldIcon} ${isActive ? styles.fieldIconActive : ''}`}>
            <Calendar className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className={styles.fieldBody}>
            <label className={styles.fieldLabel}>{label}</label>
            <input
              type="text"
              inputMode="numeric"
              value={dateInput.displayValue}
              onChange={event => dateInput.handleDisplayChange(event.target.value)}
              onFocus={() => dateInput.setFocused(true)}
              onBlur={() => dateInput.setFocused(false)}
              placeholder="dd/mm/aaaa"
              className={styles.fieldControl}
              aria-label={label}
            />
          </div>
          <button type="button" onClick={() => dateInput.setOpen(prev => !prev)} className={styles.dateButton} aria-label={label}>
            <Calendar className="h-4 w-4" aria-hidden="true" />
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
