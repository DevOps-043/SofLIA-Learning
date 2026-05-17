'use client'

import { PremiumDatePicker } from '../PremiumDatePicker'
import type { BusinessPanelTheme, DeadlineT } from './types'

interface StartDatePanelProps {
  startDate: string
  theme: BusinessPanelTheme
  t: DeadlineT
  onStartDateChange: (nextDate: string) => void
}

export function StartDatePanel({
  startDate,
  theme,
  t,
  onStartDateChange,
}: StartDatePanelProps) {
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}>
      <label className="mb-2 block text-sm font-medium" style={{ color: theme.textColor }}>
        {t('liaSuggestion.details.startDate')}
      </label>
      <PremiumDatePicker
        value={startDate}
        onChange={onStartDateChange}
        minDate={new Date()}
        placeholder={t('liaSuggestion.details.startDate')}
      />
      <p className="mt-2 text-xs" style={{ color: theme.mutedTextColor }}>
        {t('liaSuggestion.details.defaultDate')}
      </p>
    </div>
  )
}
