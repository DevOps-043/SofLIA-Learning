'use client'

import { motion } from 'framer-motion'
import { CompletionNotice } from './CompletionNotice'
import { ConfirmDetailsGrid } from './ConfirmDetailsGrid'
import type {
  ApproachConfigMap,
  ApproachSuggestion,
  BusinessPanelTheme,
  DeadlineT,
} from './types'

interface ConfirmStepProps {
  approachConfig: ApproachConfigMap
  i18nLanguage: string
  selectedSuggestion: ApproachSuggestion
  startDate: string
  theme: BusinessPanelTheme
  t: DeadlineT
}

export function ConfirmStep({
  approachConfig,
  i18nLanguage,
  selectedSuggestion,
  startDate,
  theme,
  t,
}: ConfirmStepProps) {
  const config = approachConfig[selectedSuggestion.approach]
  const Icon = config.icon

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-bold" style={{ color: theme.textColor }}>
          {t('liaSuggestion.steps.confirm.title')}
        </h3>
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {t('liaSuggestion.steps.confirm.subtitle')}
        </p>
      </div>
      <div className="rounded-xl border p-6" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl" style={{ background: config.background }}>
            <Icon className="h-8 w-8" style={{ color: theme.onPrimaryColor }} />
          </div>
          <div>
            <h4 className="mb-1 text-lg font-bold" style={{ color: theme.textColor }}>
              {t('liaSuggestion.details.focus')} {t(`liaSuggestion.approaches.${selectedSuggestion.approach}.title`)}
            </h4>
            <p className="text-sm" style={{ color: theme.subtextColor }}>
              {selectedSuggestion.description}
            </p>
          </div>
        </div>
        <ConfirmDetailsGrid
          i18nLanguage={i18nLanguage}
          selectedSuggestion={selectedSuggestion}
          startDate={startDate}
          theme={theme}
          t={t}
        />
        <CompletionNotice selectedSuggestion={selectedSuggestion} theme={theme} t={t} />
      </div>
    </motion.div>
  )
}
