import type { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export interface PremiumDatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  className?: string
}

export interface DatePickerViewDate {
  year: number
  month: number
}

export interface CalendarDay {
  day: number
  month: 'prev' | 'current' | 'next'
  date: Date
}

export type BusinessPanelTheme = ReturnType<typeof useBusinessPanelTheme>
