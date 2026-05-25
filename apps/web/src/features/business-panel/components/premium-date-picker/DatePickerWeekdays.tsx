import type { BusinessPanelTheme } from './types'

interface DatePickerWeekdaysProps {
  theme: BusinessPanelTheme
  weekdayLabels: string[]
}

export function DatePickerWeekdays({ theme, weekdayLabels }: DatePickerWeekdaysProps) {
  return (
    <div className="mb-2 grid grid-cols-7 gap-1">
      {weekdayLabels.map((day, index) => (
        <div
          className="flex h-8 items-center justify-center text-xs font-medium capitalize"
          key={`${day}-${index}`}
          style={{ color: index === 0 ? theme.dangerColor : theme.mutedTextColor }}
        >
          {day}
        </div>
      ))}
    </div>
  )
}
