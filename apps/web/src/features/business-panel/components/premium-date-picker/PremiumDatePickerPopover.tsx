import { motion } from 'framer-motion'
import { DatePickerFooter } from './DatePickerFooter'
import { DatePickerGrid } from './DatePickerGrid'
import { DatePickerHeader } from './DatePickerHeader'
import { DatePickerWeekdays } from './DatePickerWeekdays'
import type { BusinessPanelTheme, CalendarDay, DatePickerViewDate } from './types'

interface PremiumDatePickerPopoverProps {
  calendarDays: CalendarDay[]
  handleNextMonth: () => void
  handlePrevMonth: () => void
  handleSelectDate: (date: Date) => void
  handleToday: () => void
  isDateDisabled: (date: Date) => boolean
  isSelected: (date: Date) => boolean
  isToday: (date: Date) => boolean
  monthLabel: string
  onClear: () => void
  theme: BusinessPanelTheme
  viewDate: DatePickerViewDate
  weekdayLabels: string[]
}

export function PremiumDatePickerPopover(props: PremiumDatePickerPopoverProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute left-0 top-full z-50 mt-2 min-w-[320px] rounded-2xl border p-4 shadow-2xl"
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      style={{
        backgroundColor: props.theme.panelBg,
        borderColor: props.theme.borderColor,
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${props.theme.primaryColor}20`,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <DatePickerHeader {...props} />
      <DatePickerWeekdays theme={props.theme} weekdayLabels={props.weekdayLabels} />
      <DatePickerGrid {...props} />
      <DatePickerFooter
        handleToday={props.handleToday}
        onClear={props.onClear}
        theme={props.theme}
      />
    </motion.div>
  )
}
