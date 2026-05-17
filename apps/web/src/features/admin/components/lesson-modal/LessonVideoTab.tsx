'use client'

import { useTranslation } from 'react-i18next'
import { VideoProviderSelector } from '../VideoProviderSelector'
import { LessonDurationInput } from './LessonDurationInput'
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

      <LessonDurationInput
        durationSeconds={formData.duration_seconds}
        durationAutoDetected={durationAutoDetected}
        onDurationChange={(durationSeconds) => {
          onFormDataChange((currentFormData) => ({
            ...currentFormData,
            duration_seconds: durationSeconds,
          }))
        }}
        onManualDurationEdit={() => onDurationAutoDetectedChange(false)}
        t={t}
      />
    </div>
  )
}
