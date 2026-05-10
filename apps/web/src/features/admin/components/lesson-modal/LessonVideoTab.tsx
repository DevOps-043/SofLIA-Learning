'use client'

import { ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { VideoProviderSelector } from '../VideoProviderSelector'
import { formatLessonDuration, parseLessonDuration } from './service'
import type { LessonFormData } from './types'

interface LessonVideoTabProps {
  durationAutoDetected: boolean
  formData: LessonFormData
  onFormDataChange: (updater: (currentFormData: LessonFormData) => LessonFormData) => void
  onDurationAutoDetectedChange: (value: boolean) => void
  onGenerateAI: (videoUrl?: string) => void
}

export function LessonVideoTab({
  durationAutoDetected,
  formData,
  onFormDataChange,
  onDurationAutoDetectedChange,
  onGenerateAI,
}: LessonVideoTabProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="space-y-4">
      <VideoProviderSelector
        provider={formData.video_provider}
        videoProviderId={formData.video_provider_id}
        onProviderChange={(provider) => {
          onFormDataChange((currentFormData) => ({
            ...currentFormData,
            video_provider: provider,
          }))
          onDurationAutoDetectedChange(false)
        }}
        onVideoIdChange={(id) => {
          onFormDataChange((currentFormData) => ({
            ...currentFormData,
            video_provider_id: id,
          }))
          onDurationAutoDetectedChange(false)
        }}
        onDurationChange={(durationSeconds) => {
          if (!durationSeconds || durationSeconds <= 0) {
            return
          }

          onFormDataChange((currentFormData) => ({
            ...currentFormData,
            duration_seconds: durationSeconds,
          }))
          onDurationAutoDetectedChange(true)
        }}
        onUploadComplete={(url) => {
          if (url && url.startsWith('http')) {
            onGenerateAI(url)
          }
        }}
      />

      <div className="group">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wide">
            {t('workshops.editor.lessons.durationLabel')}
          </label>
          {durationAutoDetected && (
            <span className="text-xs text-[#10B981] dark:text-[#10B981] font-medium">
              {t('workshops.editor.lessons.durationDetected')}
            </span>
          )}
        </div>
        <div className="relative">
          <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60" />
          <input
            type="text"
            value={formatLessonDuration(formData.duration_seconds)}
            onChange={(event) => {
              const durationSeconds = parseLessonDuration(event.target.value)
              onFormDataChange((currentFormData) => ({
                ...currentFormData,
                duration_seconds: durationSeconds,
              }))
              if (durationSeconds > 0) {
                onDurationAutoDetectedChange(false)
              }
            }}
            placeholder="10:30"
            pattern="\\d{1,3}:\\d{2}"
            className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 transition-all duration-200 ${
              durationAutoDetected
                ? 'border-[#10B981] dark:border-[#10B981] bg-[#10B981]/10 dark:bg-[#10B981]/20 focus:ring-[#10B981]/40'
                : 'border-[#E9ECEF] dark:border-[#6C757D]/30 focus:ring-[#00D4B3]/40 focus:border-transparent'
            }`}
          />
        </div>
        {durationAutoDetected && (
          <p className="mt-1 text-xs text-[#6C757D] dark:text-white/60">
            {t('workshops.editor.lessons.durationDetectedDesc')}
          </p>
        )}
      </div>
    </div>
  )
}
