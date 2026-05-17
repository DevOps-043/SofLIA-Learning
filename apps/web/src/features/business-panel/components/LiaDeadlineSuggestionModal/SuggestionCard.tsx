'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import { formatDuration } from '@/lib/course-deadline-calculator'
import { formatDate } from '@/utils/date-formatter'
import { formatStudyPace } from './deadline-formatters'
import type {
  ApproachConfigMap,
  ApproachSuggestion,
  BusinessPanelTheme,
  DeadlineT,
} from './types'

interface SuggestionCardProps {
  approachConfig: ApproachConfigMap
  i18nLanguage: string
  suggestion: ApproachSuggestion
  theme: BusinessPanelTheme
  t: DeadlineT
  onSelect: (suggestion: ApproachSuggestion) => void
}

export function SuggestionCard({
  approachConfig,
  i18nLanguage,
  suggestion,
  theme,
  t,
  onSelect,
}: SuggestionCardProps) {
  const config = approachConfig[suggestion.approach]
  const Icon = config.icon
  const deadlineDate = new Date(suggestion.deadline_date)

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(suggestion)}
      className="rounded-xl border p-6 text-left transition-all"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: config.background }}>
          <Icon className="h-6 w-6" style={{ color: theme.onPrimaryColor }} />
        </div>
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="text-lg font-bold" style={{ color: theme.textColor }}>
              {t(`liaSuggestion.approaches.${suggestion.approach}.title`)}
            </h4>
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
              {suggestion.estimated_completion_rate} {t('liaSuggestion.details.completedRate')}
            </span>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: theme.mutedTextColor }} />
              <span className="text-sm" style={{ color: theme.subtextColor }}>
                {formatDate(deadlineDate, i18nLanguage, { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: theme.mutedTextColor }} />
              <span className="text-sm" style={{ color: theme.subtextColor }}>
                {formatDuration(suggestion.duration_days)}
              </span>
            </div>
          </div>
          <p className="mb-2 text-sm" style={{ color: theme.subtextColor }}>
            {suggestion.description}
          </p>
          <p className="text-xs" style={{ color: theme.mutedTextColor }}>
            {t('liaSuggestion.details.studyPace')}: {formatStudyPace(suggestion, t)}
          </p>
        </div>
      </div>
    </motion.button>
  )
}
