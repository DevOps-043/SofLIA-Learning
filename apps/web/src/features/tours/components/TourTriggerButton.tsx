'use client'

import { HelpCircle } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'

interface TourTriggerButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'type'> {
  onStart: () => void
  iconClassName?: string
  showLabel?: boolean
}

export function TourTriggerButton({
  onStart,
  className,
  iconClassName,
  showLabel = false,
  ...buttonProps
}: TourTriggerButtonProps) {
  const { t } = useTranslation('tours')
  const label = t('actions.restart')

  return (
    <button
      {...buttonProps}
      type="button"
      onClick={onStart}
      aria-label={buttonProps['aria-label'] ?? label}
      title={buttonProps.title ?? label}
      className={cn(
        showLabel
          ? 'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white'
          : 'inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-gray-500 dark:hover:text-accent',
        className,
      )}
    >
      <HelpCircle className={cn('h-5 w-5', iconClassName)} aria-hidden="true" />
      {showLabel ? <span className="whitespace-nowrap">{label}</span> : null}
    </button>
  )
}
