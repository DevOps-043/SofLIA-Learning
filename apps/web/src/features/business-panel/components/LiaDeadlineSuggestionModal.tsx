'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Scale,
  Sparkles,
  Sprout,
  X,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '@/lib/course-deadline-calculator'
import { formatDate } from '@/utils/date-formatter'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { PremiumDatePicker } from './PremiumDatePicker'

interface ApproachSuggestion {
  approach: 'fast' | 'balanced' | 'long'
  deadline_date: string
  duration_days: number
  duration_weeks: number
  hours_per_week: number
  description: string
  estimated_completion_rate: string
}

interface LiaDeadlineSuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  orgSlug: string
  onSelectDeadline: (deadline: string, startDate: string, approach: string) => void
}

type Step = 'suggestions' | 'confirm'

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
  const [step, setStep] = useState<Step>('suggestions')
  const [suggestions, setSuggestions] = useState<ApproachSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<ApproachSuggestion | null>(null)
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const approachConfig = useMemo(
    () => ({
      fast: {
        icon: Zap,
        color: theme.dangerColor,
        background: `linear-gradient(135deg, ${theme.dangerColor}, ${theme.warningColor})`,
      },
      balanced: {
        icon: Scale,
        color: theme.secondaryColor,
        background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.accentColor})`,
      },
      long: {
        icon: Sprout,
        color: theme.successColor,
        background: `linear-gradient(135deg, ${theme.successColor}, ${theme.accentColor})`,
      },
    }),
    [theme.accentColor, theme.dangerColor, theme.secondaryColor, theme.successColor, theme.warningColor]
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setStep('suggestions')
    setSelectedSuggestion(null)
    setStartDate(new Date().toISOString().split('T')[0])
    setError(null)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void fetchSuggestions()
  }, [isOpen, startDate, courseId, orgSlug])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/${orgSlug}/business/courses/${courseId}/deadline-suggestions?start_date=${new Date(startDate).toISOString()}`,
        { credentials: 'include' }
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
  }

  const handleSuggestionSelect = (suggestion: ApproachSuggestion) => {
    setSelectedSuggestion(suggestion)
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (!selectedSuggestion) {
      return
    }

    onSelectDeadline(
      selectedSuggestion.deadline_date,
      new Date(startDate).toISOString(),
      selectedSuggestion.approach
    )
    onClose()
  }

  const renderStudyPace = (suggestion: ApproachSuggestion) => {
    if (suggestion.duration_days <= 7) {
      return `${(suggestion.hours_per_week / 7).toFixed(1)} ${t('liaSuggestion.details.hoursPerDay', { defaultValue: 'horas/día' })}`
    }

    return `${suggestion.hours_per_week} ${t('liaSuggestion.details.hoursPerWeek')}`
  }

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: theme.overlayBg }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
        >
          <div className="flex items-center justify-between border-b p-6" style={{ borderColor: theme.borderColor }}>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <Sparkles className="h-5 w-5" style={{ color: theme.primaryColor }} />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: theme.textColor }}>
                  {t('liaSuggestion.title')}
                </h2>
                <p className="text-sm" style={{ color: theme.subtextColor }}>
                  {courseTitle}
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
              onMouseEnter={event => {
                event.currentTarget.style.backgroundColor = theme.hoverBg
              }}
              onMouseLeave={event => {
                event.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <X className="h-5 w-5" style={{ color: theme.subtextColor }} />
            </motion.button>
          </div>

          <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 rounded-xl border p-4 text-sm"
                style={{
                  backgroundColor: `${theme.dangerColor}10`,
                  borderColor: `${theme.dangerColor}30`,
                  color: theme.dangerColor,
                }}
              >
                {error}
              </motion.div>
            ) : null}

            {step === 'suggestions' ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-2xl font-bold" style={{ color: theme.textColor }}>
                    {t('liaSuggestion.steps.suggestions.title')}
                  </h3>
                  <p className="text-sm" style={{ color: theme.subtextColor }}>
                    {t('liaSuggestion.steps.suggestions.subtitle')}
                  </p>
                </div>

                <div
                  className="rounded-2xl border p-5"
                  style={{
                    backgroundColor: theme.panelBg,
                    borderColor: theme.borderColor,
                  }}
                >
                  <label className="mb-2 block text-sm font-medium" style={{ color: theme.textColor }}>
                    {t('liaSuggestion.details.startDate')}
                  </label>
                  <PremiumDatePicker
                    value={startDate}
                    onChange={nextDate => {
                      setStartDate(nextDate)
                      setSelectedSuggestion(null)
                    }}
                    minDate={new Date()}
                    placeholder={t('liaSuggestion.details.startDate')}
                  />
                  <p className="mt-2 text-xs" style={{ color: theme.mutedTextColor }}>
                    {t('liaSuggestion.details.defaultDate')}
                  </p>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="mb-4 h-12 w-12 animate-spin" style={{ color: theme.primaryColor }} />
                    <p style={{ color: theme.subtextColor }}>
                      {t('liaSuggestion.steps.suggestions.calculating')}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {suggestions.map(suggestion => {
                      const config = approachConfig[suggestion.approach]
                      const Icon = config.icon
                      const deadlineDate = new Date(suggestion.deadline_date)

                      return (
                        <motion.button
                          key={suggestion.approach}
                          type="button"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="rounded-xl border p-6 text-left transition-all"
                          style={{
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor,
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ background: config.background }}
                            >
                              <Icon className="h-6 w-6" style={{ color: theme.onPrimaryColor }} />
                            </div>
                            <div className="flex-1">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <h4 className="text-lg font-bold" style={{ color: theme.textColor }}>
                                  {t(`liaSuggestion.approaches.${suggestion.approach}.title`)}
                                </h4>
                                <span
                                  className="rounded-full px-3 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: `${config.color}20`,
                                    color: config.color,
                                  }}
                                >
                                  {suggestion.estimated_completion_rate} {t('liaSuggestion.details.completedRate')}
                                </span>
                              </div>

                              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" style={{ color: theme.mutedTextColor }} />
                                  <span className="text-sm" style={{ color: theme.subtextColor }}>
                                    {formatDate(deadlineDate, i18n.language, {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
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
                                {t('liaSuggestion.details.studyPace')}: {renderStudyPace(suggestion)}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            ) : null}

            {step === 'confirm' && selectedSuggestion ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-2xl font-bold" style={{ color: theme.textColor }}>
                    {t('liaSuggestion.steps.confirm.title')}
                  </h3>
                  <p className="text-sm" style={{ color: theme.subtextColor }}>
                    {t('liaSuggestion.steps.confirm.subtitle')}
                  </p>
                </div>

                <div
                  className="rounded-xl border p-6"
                  style={{
                    backgroundColor: theme.panelBg,
                    borderColor: theme.borderColor,
                  }}
                >
                  <div className="mb-6 flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-xl"
                      style={{ background: approachConfig[selectedSuggestion.approach].background }}
                    >
                      {(() => {
                        const Icon = approachConfig[selectedSuggestion.approach].icon
                        return <Icon className="h-8 w-8" style={{ color: theme.onPrimaryColor }} />
                      })()}
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

                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs" style={{ color: theme.mutedTextColor }}>
                        {t('liaSuggestion.details.startDate')}
                      </p>
                      <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                        {formatDate(`${startDate}T00:00:00`, i18n.language, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs" style={{ color: theme.mutedTextColor }}>
                        {t('liaSuggestion.details.dueDate')}
                      </p>
                      <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                        {formatDate(selectedSuggestion.deadline_date, i18n.language, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs" style={{ color: theme.mutedTextColor }}>
                        {t('liaSuggestion.details.estimatedDuration')}
                      </p>
                      <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                        {formatDuration(selectedSuggestion.duration_days)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs" style={{ color: theme.mutedTextColor }}>
                        {t('liaSuggestion.details.studyPace')}
                      </p>
                      <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                        {renderStudyPace(selectedSuggestion)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-3 rounded-xl border p-4"
                    style={{
                      backgroundColor: `${theme.accentColor}10`,
                      borderColor: `${theme.accentColor}20`,
                    }}
                  >
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
                </div>
              </motion.div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t p-6" style={{ borderColor: theme.borderColor }}>
            {step === 'confirm' ? (
              <>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('suggestions')}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors"
                  style={{ color: theme.textColor }}
                  onMouseEnter={event => {
                    event.currentTarget.style.backgroundColor = theme.hoverBg
                  }}
                  onMouseLeave={event => {
                    event.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('liaSuggestion.buttons.back')}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  className="ml-auto flex items-center gap-2 rounded-xl px-8 py-3 font-medium"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: theme.onPrimaryColor,
                  }}
                >
                  {t('liaSuggestion.buttons.confirm')}
                  <CheckCircle className="h-4 w-4" style={{ color: theme.onPrimaryColor }} />
                </motion.button>
              </>
            ) : (
              <div className="ml-auto">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="rounded-xl border px-6 py-3 font-medium"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }}
                >
                  {t('liaSuggestion.buttons.cancel', { defaultValue: 'Cerrar' })}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
