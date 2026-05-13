'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  XMarkIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import {
  canGenerateLessonAi,
  createLessonFormData,
  lessonModalTabs,
  validateLessonForm,
  LessonContentTab,
  type LessonModalProps,
  LessonVideoTab,
} from './lesson-modal'
import { InstructorSelect } from './lesson-modal'

export function LessonModal({
  lesson,
  moduleId: _moduleId,
  onClose,
  onSave,
  instructors = [],
}: LessonModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [formData, setFormData] = useState(() =>
    createLessonFormData(lesson, instructors),
  )
  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [durationAutoDetected, setDurationAutoDetected] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'video' | 'content'>(
    'basic',
  )

  useEffect(() => {
    setFormData(createLessonFormData(lesson, instructors))
    setActiveTab('basic')
    setError(null)
  }, [lesson, instructors])

  async function handleGenerateAI(videoUrl?: string) {
    const targetUrl = videoUrl || formData.video_provider_id

    if (!canGenerateLessonAi(formData.video_provider, targetUrl)) {
      setError(t('workshops.editor.lessons.aiErrorVideo'))
      return
    }

    setGeneratingAI(true)
    setError(null)
    setActiveTab('content')

    try {
      const response = await fetch('/api/admin/ai/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: targetUrl }),
      })
      const data = (await response.json()) as {
        error?: string
        summary?: string
        transcript?: string
      }

      if (!response.ok) {
        throw new Error(data.error || t('workshops.errors.processVideo'))
      }

      setFormData((currentFormData) => ({
        ...currentFormData,
        transcript_content: data.transcript || '',
        summary_content: data.summary || '',
      }))
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : t('workshops.errors.generateContent'),
      )
    } finally {
      setGeneratingAI(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const validationError = validateLessonForm(formData)
    if (validationError) {
      setError(t(`workshops.editor.lessons.validation.${validationError}`))
      return
    }

    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('workshops.errors.saveLesson'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-[100dvh] items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              data-testid="lesson-modal-panel"
              className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative border-b border-[#0A2540]/20 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-4 py-4 dark:from-[#0A2540] dark:to-[#0A2540]/80 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                      <AcademicCapIcon className="h-5 w-5 text-[#00D4B3]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {lesson ? t('workshops.editor.lessons.editLesson') : t('workshops.editor.lessons.createLesson')}
                      </h3>
                      <p className="text-xs text-white/70">
                        {lesson
                          ? t('workshops.editor.lessons.editLessonDesc')
                          : t('workshops.editor.lessons.createLessonDesc')}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto border-b border-[#E9ECEF] bg-[#E9ECEF]/50 px-4 py-3 dark:border-[#6C757D]/30 dark:bg-[#0A0D12] sm:px-6">
                {lessonModalTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex min-w-[132px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-0 ${
                        isActive
                          ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                          : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t(`workshops.editor.lessons.tabs.${tab.id}`)}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl"
                    >
                      <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    {activeTab === 'basic' && (
                      <motion.div
                        key="basic"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="group">
                          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                            {t('workshops.editor.lessons.lessonTitleLabel')}
                          </label>
                          <div className="relative">
                            <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                            <input
                              type="text"
                              required
                              value={formData.lesson_title}
                              onChange={(event) =>
                                setFormData((currentFormData) => ({
                                  ...currentFormData,
                                  lesson_title: event.target.value,
                                }))
                              }
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              placeholder={t('workshops.editor.lessons.lessonTitlePlaceholder')}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                            {t('workshops.editor.lessons.lessonDescriptionLabel')}
                          </label>
                          <textarea
                            rows={3}
                            value={formData.lesson_description}
                            onChange={(event) =>
                              setFormData((currentFormData) => ({
                                ...currentFormData,
                                lesson_description: event.target.value,
                              }))
                            }
                            className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                            placeholder={t('workshops.editor.lessons.lessonDescriptionPlaceholder')}
                          />
                        </div>

                        <InstructorSelect
                          value={formData.instructor_id}
                          onChange={(id) =>
                            setFormData((currentFormData) => ({
                              ...currentFormData,
                              instructor_id: id,
                            }))
                          }
                          instructors={instructors}
                        />

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
                        >
                          <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={formData.is_published}
                                onChange={(event) =>
                                  setFormData((currentFormData) => ({
                                    ...currentFormData,
                                    is_published: event.target.checked,
                                  }))
                                }
                                className="sr-only"
                              />
                              <motion.div
                                animate={{
                                  backgroundColor: formData.is_published
                                    ? '#00D4B3'
                                    : '#E9ECEF',
                                  borderColor: formData.is_published
                                    ? '#00D4B3'
                                    : '#E9ECEF',
                                }}
                                className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
                              >
                                {formData.is_published && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 500,
                                      damping: 30,
                                    }}
                                  >
                                    <CheckCircleIcon className="h-4 w-4 text-white" />
                                  </motion.div>
                                )}
                              </motion.div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-[#0A2540] dark:text-white">
                                {t('workshops.editor.modules.publishedLabel')}
                              </span>
                              <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
                                {t('workshops.editor.modules.publishedDesc')}
                              </p>
                            </div>
                          </label>
                        </motion.div>
                      </motion.div>
                    )}

                    {activeTab === 'video' && (
                      <motion.div
                        key="video"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <LessonVideoTab
                          durationAutoDetected={durationAutoDetected}
                          formData={formData}
                          onFormDataChange={setFormData}
                          onDurationAutoDetectedChange={setDurationAutoDetected}
                          onGenerateAI={handleGenerateAI}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'content' && (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <LessonContentTab
                          formData={formData}
                          generatingAI={generatingAI}
                          onFormDataChange={setFormData}
                          onGenerateAI={() => handleGenerateAI()}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#E9ECEF] bg-[#E9ECEF]/30 px-4 py-4 dark:border-[#6C757D]/30 dark:bg-[#0A0D12] sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl border border-[#E9ECEF] bg-white px-6 py-2.5 text-sm font-medium text-[#6C757D] transition-colors duration-200 hover:bg-[#E9ECEF] dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white/70 dark:hover:bg-[#0A2540]/30 sm:w-auto"
                    disabled={loading}
                  >
                    {tc('actions.cancel')}
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0A2540]/20 transition-colors duration-200 hover:bg-[#0d2f4d] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{tc('actions.saving')}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>{tc('actions.save')}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </>
    </AnimatePresence>
  )
}
