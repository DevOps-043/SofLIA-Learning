'use client'

import { useCallback, useEffect, useState } from 'react'
import { todayDateOnly } from './deadline-formatters'
import type { ApproachSuggestion, DeadlineStep, DeadlineT } from './types'

interface UseLiaDeadlineSuggestionStateParams {
  courseId: string
  isOpen: boolean
  onClose: () => void
  onSelectDeadline: (deadline: string, startDate: string, approach: string) => void
  orgSlug: string
  t: DeadlineT
}

export function useLiaDeadlineSuggestionState({
  courseId,
  isOpen,
  onClose,
  onSelectDeadline,
  orgSlug,
  t,
}: UseLiaDeadlineSuggestionStateParams) {
  const [step, setStep] = useState<DeadlineStep>('suggestions')
  const [suggestions, setSuggestions] = useState<ApproachSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<ApproachSuggestion | null>(null)
  const [startDate, setStartDate] = useState(todayDateOnly())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const startIso = new Date(startDate).toISOString()
      const response = await fetch(
        `/api/${orgSlug}/business/courses/${courseId}/deadline-suggestions?start_date=${startIso}`,
        { credentials: 'include' },
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('liaSuggestion.error'))
      }

      const data = await response.json()
      setSuggestions(data.suggestions ?? [])
      setStep('suggestions')
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : t('liaSuggestion.error'))
    } finally {
      setIsLoading(false)
    }
  }, [courseId, orgSlug, startDate, t])

  useEffect(() => {
    if (!isOpen) return

    setStep('suggestions')
    setSelectedSuggestion(null)
    setStartDate(todayDateOnly())
    setError(null)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) void fetchSuggestions()
  }, [fetchSuggestions, isOpen])

  const handleSuggestionSelect = (suggestion: ApproachSuggestion) => {
    setSelectedSuggestion(suggestion)
    setStep('confirm')
  }

  const handleStartDateChange = (nextDate: string) => {
    setStartDate(nextDate)
    setSelectedSuggestion(null)
  }

  const handleConfirm = () => {
    if (!selectedSuggestion) return

    onSelectDeadline(
      selectedSuggestion.deadline_date,
      new Date(startDate).toISOString(),
      selectedSuggestion.approach,
    )
    onClose()
  }

  return {
    error,
    handleConfirm,
    handleStartDateChange,
    handleSuggestionSelect,
    isLoading,
    selectedSuggestion,
    setStep,
    startDate,
    step,
    suggestions,
  }
}
