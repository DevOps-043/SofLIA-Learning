'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { ConfirmStep } from './LiaDeadlineSuggestionModal/ConfirmStep'
import { DeadlineModalFooter } from './LiaDeadlineSuggestionModal/DeadlineModalFooter'
import { DeadlineModalHeader } from './LiaDeadlineSuggestionModal/DeadlineModalHeader'
import { DeadlineModalShell } from './LiaDeadlineSuggestionModal/DeadlineModalShell'
import { ErrorAlert } from './LiaDeadlineSuggestionModal/ErrorAlert'
import { SuggestionsStep } from './LiaDeadlineSuggestionModal/SuggestionsStep'
import { getApproachConfig } from './LiaDeadlineSuggestionModal/approach-config'
import { useLiaDeadlineSuggestionState } from './LiaDeadlineSuggestionModal/useLiaDeadlineSuggestionState'
import type { LiaDeadlineSuggestionModalProps } from './LiaDeadlineSuggestionModal/types'

export function LiaDeadlineSuggestionModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  orgSlug,
  onSelectDeadline,
}: LiaDeadlineSuggestionModalProps) {
  const { t, i18n } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const approachConfig = useMemo(() => getApproachConfig(theme), [theme])
  const state = useLiaDeadlineSuggestionState({
    courseId,
    isOpen,
    onClose,
    onSelectDeadline,
    orgSlug,
    t,
  })

  if (!isOpen) return null

  return (
    <DeadlineModalShell theme={theme} onClose={onClose}>
      <DeadlineModalHeader courseTitle={courseTitle} theme={theme} t={t} onClose={onClose} />
      <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
        {state.error ? <ErrorAlert error={state.error} theme={theme} /> : null}
        {state.step === 'suggestions' ? (
          <SuggestionsStep
            approachConfig={approachConfig}
            i18nLanguage={i18n.language}
            isLoading={state.isLoading}
            setSelectedSuggestion={state.handleSuggestionSelect}
            setStartDate={state.handleStartDateChange}
            startDate={state.startDate}
            suggestions={state.suggestions}
            t={t}
            theme={theme}
          />
        ) : null}
        {state.step === 'confirm' && state.selectedSuggestion ? (
          <ConfirmStep
            approachConfig={approachConfig}
            i18nLanguage={i18n.language}
            selectedSuggestion={state.selectedSuggestion}
            startDate={state.startDate}
            t={t}
            theme={theme}
          />
        ) : null}
      </div>
      <DeadlineModalFooter
        step={state.step}
        theme={theme}
        t={t}
        onBack={() => state.setStep('suggestions')}
        onClose={onClose}
        onConfirm={state.handleConfirm}
      />
    </DeadlineModalShell>
  )
}
