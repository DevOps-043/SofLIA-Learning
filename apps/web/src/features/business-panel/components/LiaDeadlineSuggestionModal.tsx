'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  Zap,
  Scale,
  Sprout,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { formatDuration } from '@/lib/course-deadline-calculator'
import { PremiumDatePicker } from './PremiumDatePicker'
import { useTranslation } from 'react-i18next'

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

type Step = 'approach' | 'suggestions' | 'confirm'

const approachConfig = {
  fast: {
    icon: Zap,
    color: '#EF4444',
    gradient: 'from-red-500 to-orange-500'
  },
  balanced: {
    icon: Scale,
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500'
  },
  long: {
    icon: Sprout,
    color: '#10B981',
    gradient: 'from-green-500 to-emerald-500'
  }
}

export function LiaDeadlineSuggestionModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  orgSlug,
  onSelectDeadline
}: LiaDeadlineSuggestionModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { t } = useTranslation('business')

  const [step, setStep] = useState<Step>('approach')
  const [selectedApproach, setSelectedApproach] = useState<'fast' | 'balanced' | 'long' | null>(null)
  const [suggestions, setSuggestions] = useState<ApproachSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<ApproachSuggestion | null>(null)
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Theme colors
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const primaryColor = panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1')
  const accentColor = panelStyles?.accent_color || '#10B981'
  const cardBackground = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  // Reset state and fetch suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('suggestions')
      setSelectedApproach(null)
      // setSuggestions([]) // Keep empty initially or fetch immediately
      setSelectedSuggestion(null)
      setStartDate(new Date().toISOString().split('T')[0])
      setError(null)
      fetchSuggestions()
    }
  }, [isOpen])

  // Fetch suggestions when approach is selected
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
      setSuggestions(data.suggestions)
      setStep('suggestions')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('liaSuggestion.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproachSelect = (approach: 'fast' | 'balanced' | 'long') => {
    setSelectedApproach(approach)
    fetchSuggestions()
  }

  const handleSuggestionSelect = (suggestion: ApproachSuggestion) => {
    setSelectedSuggestion(suggestion)
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (selectedSuggestion) {
      onSelectDeadline(
        selectedSuggestion.deadline_date,
        new Date(startDate).toISOString(),
        selectedSuggestion.approach
      )
      onClose()
    }
  }

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('suggestions')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border"
          style={{ backgroundColor: cardBackground, borderColor: borderColor }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: borderColor }}>
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: textColor }}>
                  {t('liaSuggestion.title')}
                </h2>
                <p className="text-sm" style={{ color: `${textColor}60` }}>
                  {courseTitle}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: `${textColor}60` }} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 1: Approach Selection */}
            {step === 'approach' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    {t('liaSuggestion.steps.approach.title')}
                  </h3>
                  <p className="text-sm" style={{ color: `${textColor}60` }}>
                    {t('liaSuggestion.steps.approach.subtitle')}
                  </p>
                </div>

                <div className="grid gap-4">
                  {(Object.keys(approachConfig) as Array<'fast' | 'balanced' | 'long'>).map((approach) => {
                    const config = approachConfig[approach]
                    const Icon = config.icon

                    return (
                      <motion.button
                        key={approach}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApproachSelect(approach)}
                        className="p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all text-left group"
                        style={{ backgroundColor: `${cardBackground}80` }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.gradient} flex-shrink-0`}
                          >
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold mb-1" style={{ color: textColor }}>
                              {t(`liaSuggestion.approaches.${approach}.title`)}
                            </h4>
                            <p className="text-sm mb-2" style={{ color: `${textColor}70` }}>
                              {t(`liaSuggestion.approaches.${approach}.subtitle`)}
                            </p>
                            <p className="text-xs" style={{ color: `${textColor}50` }}>
                              Ideal para: {t(`liaSuggestion.approaches.${approach}.ideal`)}
                            </p>
                          </div>
                          <ArrowRight
                            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: config.color }}
                          />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Suggestions */}
            {step === 'suggestions' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    {t('liaSuggestion.steps.suggestions.title')}
                  </h3>
                  <p className="text-sm" style={{ color: `${textColor}60` }}>
                    {t('liaSuggestion.steps.suggestions.subtitle')}
                  </p>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: primaryColor }} />
                    <p style={{ color: `${textColor}60` }}>{t('liaSuggestion.steps.suggestions.calculating')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {suggestions.map((suggestion) => {
                      const config = approachConfig[suggestion.approach]
                      const Icon = config.icon
                      const deadlineDate = new Date(suggestion.deadline_date)

                      return (
                        <motion.button
                          key={suggestion.approach}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="p-6 rounded-xl border hover:border-opacity-50 transition-all text-left"
                          style={{ backgroundColor: `${cardBackground}80`, borderColor: borderColor }}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.gradient} flex-shrink-0`}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-bold" style={{ color: textColor }}>
                                  {t(`liaSuggestion.approaches.${suggestion.approach}.title`)}
                                </h4>
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: `${config.color}20`, color: config.color }}
                                >
                                  {suggestion.estimated_completion_rate} {t('liaSuggestion.details.completedRate')}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" style={{ color: `${textColor}50` }} />
                                  <span className="text-sm" style={{ color: `${textColor}70` }}>
                                    {deadlineDate.toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" style={{ color: `${textColor}50` }} />
                                  <span className="text-sm" style={{ color: `${textColor}70` }}>
                                    {formatDuration(suggestion.duration_days)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm mb-2" style={{ color: `${textColor}60` }}>
                                {suggestion.description}
                              </p>

                              <p className="text-xs" style={{ color: `${textColor}50` }}>
                                {t('liaSuggestion.details.studyPace')}: {
                                  suggestion.duration_days <= 7
                                    ? `${(suggestion.hours_per_week / 7).toFixed(1)} ${t('liaSuggestion.details.hoursPerDay', 'horas/día')}`
                                    : `${suggestion.hours_per_week} ${t('liaSuggestion.details.hoursPerWeek')}`
                                }
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirm' && selectedSuggestion && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: textColor }}>
                    {t('liaSuggestion.steps.confirm.title')}
                  </h3>
                  <p className="text-sm" style={{ color: `${textColor}60` }}>
                    {t('liaSuggestion.steps.confirm.subtitle')}
                  </p>
                </div>

                {/* Summary Card */}
                <div
                  className="p-6 rounded-xl border"
                  style={{ backgroundColor: `${cardBackground}80`, borderColor: borderColor }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                        approachConfig[selectedSuggestion.approach].gradient
                      }`}
                    >
                      {(() => {
                        const Icon = approachConfig[selectedSuggestion.approach].icon
                        return <Icon className="w-8 h-8 text-white" />
                      })()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1" style={{ color: textColor }}>
                        {t('liaSuggestion.details.focus')} {t(`liaSuggestion.approaches.${selectedSuggestion.approach}.title`)}
                      </h4>
                      <p className="text-sm" style={{ color: `${textColor}60` }}>
                        {selectedSuggestion.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs mb-1" style={{ color: `${textColor}50` }}>
                        {t('liaSuggestion.details.dueDate')}
                      </p>
                      <p className="text-sm font-medium" style={{ color: textColor }}>
                        {new Date(selectedSuggestion.deadline_date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: `${textColor}50` }}>
                        {t('liaSuggestion.details.estimatedDuration')}
                      </p>
                      <p className="text-sm font-medium" style={{ color: textColor }}>
                        {formatDuration(selectedSuggestion.duration_days)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: `${textColor}50` }}>
                        {t('liaSuggestion.details.studyPace')}
                      </p>

                      <p className="text-sm font-medium" style={{ color: textColor }}>
                        {selectedSuggestion.duration_days <= 7
                          ? `${(selectedSuggestion.hours_per_week / 7).toFixed(1)} ${t('liaSuggestion.details.hoursPerDay', 'horas/día')}`
                          : `${selectedSuggestion.hours_per_week} ${t('liaSuggestion.details.hoursPerWeek')}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: `${textColor}50` }}>
                        {t('liaSuggestion.details.completionRate')}
                      </p>
                      <p className="text-sm font-medium" style={{ color: textColor }}>
                        {selectedSuggestion.estimated_completion_rate}
                      </p>
                    </div>
                  </div>

                  {/* Start Date Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                      {t('liaSuggestion.details.startDate')}
                    </label>
                    <PremiumDatePicker
                      value={startDate}
                      onChange={setStartDate}
                      minDate={new Date()}
                      placeholder={t('liaSuggestion.details.startDate')}
                    />
                    <p className="text-xs mt-2" style={{ color: `${textColor}50` }}>
                      {t('liaSuggestion.details.defaultDate')}
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div
                  className="p-4 rounded-xl border flex items-start gap-3"
                  style={{ backgroundColor: `${accentColor}10`, borderColor: borderColor }}
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: textColor }}>
                      {t('liaSuggestion.details.completionTime', { days: selectedSuggestion.duration_days })}
                    </p>
                    <p className="text-xs" style={{ color: `${textColor}60` }}>
                      {t('liaSuggestion.details.notification')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: borderColor }}>
            {step === 'confirm' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-white/5 transition-colors"
                style={{ color: textColor }}
              >
                <ArrowLeft className="w-4 h-4" />
                {t('liaSuggestion.buttons.back')}
              </motion.button>
            )}

            {step === 'confirm' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleConfirm}
                className="ml-auto px-8 py-3 rounded-xl font-medium !text-white flex items-center gap-2"
                style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
              >
                {t('liaSuggestion.buttons.confirm')}
                <CheckCircle className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
