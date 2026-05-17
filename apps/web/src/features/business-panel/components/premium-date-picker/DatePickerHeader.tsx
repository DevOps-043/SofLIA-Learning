import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BusinessPanelTheme, DatePickerViewDate } from './types'

interface DatePickerHeaderProps {
  handleNextMonth: () => void
  handlePrevMonth: () => void
  monthLabel: string
  theme: BusinessPanelTheme
  viewDate: DatePickerViewDate
}

export function DatePickerHeader({
  handleNextMonth,
  handlePrevMonth,
  monthLabel,
  theme,
  viewDate,
}: DatePickerHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <HeaderButton direction="left" onClick={handlePrevMonth} theme={theme} />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        key={`${viewDate.year}-${viewDate.month}`}
      >
        <span className="text-lg font-bold capitalize" style={{ color: theme.textColor }}>
          {monthLabel}
        </span>
        <span className="ml-2 font-medium" style={{ color: theme.subtextColor }}>
          {viewDate.year}
        </span>
      </motion.div>
      <HeaderButton direction="right" onClick={handleNextMonth} theme={theme} />
    </div>
  )
}

function HeaderButton({
  direction,
  onClick,
  theme,
}: { direction: 'left' | 'right'; onClick: () => void; theme: BusinessPanelTheme }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight

  return (
    <motion.button
      className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
      onClick={onClick}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = theme.hoverBg
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'transparent'
      }}
      type="button"
      whileHover={{ scale: 1.1, x: direction === 'left' ? -2 : 2 }}
      whileTap={{ scale: 0.9 }}
    >
      <Icon className="h-5 w-5" style={{ color: theme.textColor }} />
    </motion.button>
  )
}
