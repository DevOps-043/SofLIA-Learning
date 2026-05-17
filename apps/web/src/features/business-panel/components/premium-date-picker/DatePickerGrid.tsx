import { motion } from 'framer-motion'
import type { BusinessPanelTheme, CalendarDay, DatePickerViewDate } from './types'

interface DatePickerGridProps {
  calendarDays: CalendarDay[]
  handleSelectDate: (date: Date) => void
  isDateDisabled: (date: Date) => boolean
  isSelected: (date: Date) => boolean
  isToday: (date: Date) => boolean
  theme: BusinessPanelTheme
  viewDate: DatePickerViewDate
}

export function DatePickerGrid(props: DatePickerGridProps) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="grid grid-cols-7 gap-1"
      initial={{ opacity: 0 }}
      key={`${props.viewDate.year}-${props.viewDate.month}`}
    >
      {props.calendarDays.map((item, index) => (
        <DatePickerDayButton item={item} index={index} key={`${item.date.toISOString()}-${index}`} {...props} />
      ))}
    </motion.div>
  )
}

function DatePickerDayButton({
  handleSelectDate,
  index,
  isDateDisabled,
  isSelected,
  isToday,
  item,
  theme,
}: DatePickerGridProps & { index: number; item: CalendarDay }) {
  const isDayDisabled = isDateDisabled(item.date)
  const isDayToday = isToday(item.date)
  const isDaySelected = isSelected(item.date)
  const isOtherMonth = item.month !== 'current'

  return (
    <motion.button
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ${isDayDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'} ${isOtherMonth ? 'opacity-30' : ''}`}
      disabled={isDayDisabled}
      onClick={() => handleSelectDate(item.date)}
      onMouseEnter={(event) => {
        if (!isDayDisabled && !isDaySelected && !isDayToday) event.currentTarget.style.backgroundColor = theme.hoverBg
      }}
      onMouseLeave={(event) => {
        if (!isDayDisabled && !isDaySelected && !isDayToday) event.currentTarget.style.backgroundColor = 'transparent'
      }}
      style={{
        backgroundColor: isDaySelected ? theme.primaryColor : isDayToday ? `${theme.primaryColor}20` : 'transparent',
        boxShadow: isDaySelected ? `0 4px 15px ${theme.primaryColor}40` : 'none',
        color: isDaySelected ? theme.onPrimaryColor : isDayToday ? theme.primaryColor : theme.textColor,
      }}
      type="button"
      whileHover={!isDayDisabled ? { scale: 1.1 } : undefined}
      whileTap={!isDayDisabled ? { scale: 0.9 } : undefined}
    >
      {item.day}
      {isDayToday && !isDaySelected ? (
        <motion.div
          className="absolute bottom-1 h-1 w-1 rounded-full"
          layoutId="today-indicator"
          style={{ backgroundColor: theme.primaryColor }}
        />
      ) : null}
    </motion.button>
  )
}
