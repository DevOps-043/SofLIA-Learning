'use client'

import { HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'

interface TourTriggerButtonProps {
  onStart: () => void
  className?: string
}

export function TourTriggerButton({ onStart, className }: TourTriggerButtonProps) {
  const { t } = useTranslation('tours')
  const label = t('actions.restart')

  return (
    <button
      type="button"
      onClick={onStart}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-accent dark:text-gray-500 dark:hover:text-accent',
        className,
      )}
    >
      <HelpCircle className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
