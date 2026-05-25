'use client'

import { motion } from 'framer-motion'
import { StartDatePanel } from './StartDatePanel'
import { SuggestionCard } from './SuggestionCard'
import { SuggestionsLoading } from './SuggestionsLoading'
import type {
  ApproachConfigMap,
  ApproachSuggestion,
  BusinessPanelTheme,
  DeadlineT,
} from './types'

interface SuggestionsStepProps {
  approachConfig: ApproachConfigMap
  i18nLanguage: string
  isLoading: boolean
  setSelectedSuggestion: (suggestion: ApproachSuggestion) => void
  setStartDate: (nextDate: string) => void
  startDate: string
  suggestions: ApproachSuggestion[]
  theme: BusinessPanelTheme
  t: DeadlineT
}

export function SuggestionsStep({
  approachConfig,
  i18nLanguage,
  isLoading,
  setSelectedSuggestion,
  setStartDate,
  startDate,
  suggestions,
  theme,
  t,
}: SuggestionsStepProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-bold" style={{ color: theme.textColor }}>
          {t('liaSuggestion.steps.suggestions.title')}
        </h3>
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {t('liaSuggestion.steps.suggestions.subtitle')}
        </p>
      </div>
      <StartDatePanel
        startDate={startDate}
        theme={theme}
        t={t}
        onStartDateChange={setStartDate}
      />
      {isLoading ? (
        <SuggestionsLoading theme={theme} t={t} />
      ) : (
        <div className="grid gap-4">
          {suggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.approach}
              approachConfig={approachConfig}
              i18nLanguage={i18nLanguage}
              suggestion={suggestion}
              theme={theme}
              t={t}
              onSelect={setSelectedSuggestion}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
