'use client'

import { CheckCircle } from 'lucide-react'
import type { ApproachSuggestion, BusinessPanelTheme, DeadlineT } from './types'

interface CompletionNoticeProps {
  selectedSuggestion: ApproachSuggestion
  theme: BusinessPanelTheme
  t: DeadlineT
}

export function CompletionNotice({ selectedSuggestion, theme, t }: CompletionNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4" style={{ backgroundColor: `${theme.accentColor}10`, borderColor: `${theme.accentColor}20` }}>
      <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.accentColor }} />
      <div>
        <p className="mb-1 text-sm font-medium" style={{ color: theme.textColor }}>
          {t('liaSuggestion.details.completionTime', { days: selectedSuggestion.duration_days })}
        </p>
        <p className="text-xs" style={{ color: theme.subtextColor }}>
          {t('liaSuggestion.details.notification')}
        </p>
      </div>
    </div>
  )
}
