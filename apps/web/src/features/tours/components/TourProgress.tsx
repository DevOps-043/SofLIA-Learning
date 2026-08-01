'use client'

import { useTranslation } from 'react-i18next'

import { translateTourKey } from '../utils/tour.i18n'
import styles from './TourTooltip.module.css'

interface TourProgressProps {
  current: number
  total: number
}

export function TourProgress({ current, total }: TourProgressProps) {
  const { t, i18n } = useTranslation('tours')

  if (total <= 0) {
    return null
  }

  const currentStep = Math.min(current + 1, total)
  const progressLabel = translateTourKey(t, i18n, 'progress', {
    current: currentStep,
    total,
  })
  const progressPercentage = (currentStep / total) * 100

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={progressLabel}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={currentStep}
    >
      <div className={styles.progressMeta} aria-hidden="true">
        <span>{String(currentStep).padStart(2, '0')}</span>
        <i />
        <span>{String(total).padStart(2, '0')}</span>
      </div>
      <span className={styles.progressTrack} aria-hidden="true">
        <span
          className={styles.progressFill}
          style={{ width: `${progressPercentage}%` }}
        />
      </span>
    </div>
  )
}
