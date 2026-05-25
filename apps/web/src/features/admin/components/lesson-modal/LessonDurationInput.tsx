'use client'

import { ClockIcon } from '@heroicons/react/24/outline'
import type { TFunction } from 'i18next'

import { formatLessonDuration, parseLessonDuration } from './service'

interface LessonDurationInputProps {
  durationSeconds: number
  durationAutoDetected: boolean
  onDurationChange: (durationSeconds: number) => void
  onManualDurationEdit: () => void
  t: TFunction<'admin'>
}

export function LessonDurationInput({
  durationSeconds,
  durationAutoDetected,
  onDurationChange,
  onManualDurationEdit,
  t,
}: LessonDurationInputProps) {
  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/70">
          {t('workshops.editor.lessons.durationLabel')}
        </label>
        {durationAutoDetected && (
          <span className="text-xs font-medium text-emerald-500">
            {t('workshops.editor.lessons.durationDetected')}
          </span>
        )}
      </div>

      <div className="relative">
        <ClockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-white/60" />
        <input
          type="text"
          value={formatLessonDuration(durationSeconds)}
          onChange={(event) => {
            const parsedDurationSeconds = parseLessonDuration(event.target.value)
            onDurationChange(parsedDurationSeconds)

            if (parsedDurationSeconds > 0) {
              onManualDurationEdit()
            }
          }}
          placeholder="10:30"
          pattern="\\d{1,3}:\\d{2}"
          className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:ring-2 dark:bg-gray-900 dark:text-white dark:placeholder-white/60 ${
            durationAutoDetected
              ? 'border-emerald-500 bg-emerald-500/10 focus:ring-emerald-500/40 dark:bg-emerald-500/20'
              : 'border-gray-200 focus:border-transparent focus:ring-cyan-400/40 dark:border-gray-500/30'
          }`}
        />
      </div>

      {durationAutoDetected && (
        <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
          {t('workshops.editor.lessons.durationDetectedDesc')}
        </p>
      )}
    </div>
  )
}
