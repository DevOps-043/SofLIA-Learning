'use client'

import { formatDuration } from '@/lib/course-deadline-calculator'
import { formatDate } from '@/utils/date-formatter'
import { formatStudyPace } from './deadline-formatters'
import type { ApproachSuggestion, BusinessPanelTheme, DeadlineT } from './types'

interface ConfirmDetailsGridProps {
  i18nLanguage: string
  selectedSuggestion: ApproachSuggestion
  startDate: string
  theme: BusinessPanelTheme
  t: DeadlineT
}

export function ConfirmDetailsGrid({
  i18nLanguage,
  selectedSuggestion,
  startDate,
  theme,
  t,
}: ConfirmDetailsGridProps) {
  const dateFormat = { day: 'numeric', month: 'long', year: 'numeric' } as const

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <ConfirmDetail label={t('liaSuggestion.details.startDate')} theme={theme} value={formatDate(`${startDate}T00:00:00`, i18nLanguage, dateFormat)} />
      <ConfirmDetail label={t('liaSuggestion.details.dueDate')} theme={theme} value={formatDate(selectedSuggestion.deadline_date, i18nLanguage, dateFormat)} />
      <ConfirmDetail label={t('liaSuggestion.details.estimatedDuration')} theme={theme} value={formatDuration(selectedSuggestion.duration_days)} />
      <ConfirmDetail label={t('liaSuggestion.details.studyPace')} theme={theme} value={formatStudyPace(selectedSuggestion, t)} />
    </div>
  )
}

function ConfirmDetail({
  label,
  theme,
  value,
}: {
  label: string
  theme: BusinessPanelTheme
  value: string
}) {
  return (
    <div>
      <p className="mb-1 text-xs" style={{ color: theme.mutedTextColor }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: theme.textColor }}>
        {value}
      </p>
    </div>
  )
}
