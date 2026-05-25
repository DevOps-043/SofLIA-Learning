'use client'

import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { PremiumDatePickerButton } from './premium-date-picker/PremiumDatePickerButton'
import { PremiumDatePickerPopover } from './premium-date-picker/PremiumDatePickerPopover'
import { usePremiumDatePicker } from './premium-date-picker/usePremiumDatePicker'
import type { PremiumDatePickerProps } from './premium-date-picker/types'

export function PremiumDatePicker({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  className = '',
}: PremiumDatePickerProps) {
  const theme = useBusinessPanelTheme()
  const { i18n, t } = useTranslation('common')
  const picker = usePremiumDatePicker({
    locale: i18n.language,
    maxDate,
    minDate,
    onChange,
    value,
  })

  return (
    <div ref={picker.containerRef} className={`relative ${className}`}>
      <PremiumDatePickerButton
        disabled={disabled}
        displayValue={picker.displayValue}
        isOpen={picker.isOpen}
        onClear={picker.handleClear}
        onToggle={() => !disabled && picker.setIsOpen((isOpen) => !isOpen)}
        placeholder={placeholder || t('datePicker.placeholder')}
        theme={theme}
        value={value}
      />

      <AnimatePresence>
        {picker.isOpen ? (
          <PremiumDatePickerPopover
            calendarDays={picker.calendarDays}
            handleNextMonth={picker.handleNextMonth}
            handlePrevMonth={picker.handlePrevMonth}
            handleSelectDate={picker.handleSelectDate}
            handleToday={picker.handleToday}
            isDateDisabled={picker.isDateDisabled}
            isSelected={picker.isSelected}
            isToday={picker.isToday}
            monthLabel={picker.monthLabel}
            onClear={() => onChange('')}
            theme={theme}
            viewDate={picker.viewDate}
            weekdayLabels={picker.weekdayLabels}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
