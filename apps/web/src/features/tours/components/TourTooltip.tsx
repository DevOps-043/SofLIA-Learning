'use client'

import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import type { TooltipRenderProps } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'

import { translateTourKey } from '../utils/tour.i18n'
import { isMobileViewport } from '../utils/tour.helpers'
import { TourProgress } from './TourProgress'

export function TourTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  const { t, i18n } = useTranslation('tours')
  const isMobile = isMobileViewport()
  const skipLabel = translateTourKey(t, i18n, 'actions.skip')
  const backLabel = translateTourKey(t, i18n, 'actions.back')
  const primaryLabel = translateTourKey(t, i18n, isLastStep ? 'actions.finish' : 'actions.next')

  return (
    <section
      {...tooltipProps}
      className={cn(
        'joyride-tooltip-container pointer-events-auto relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-800',
        // Width: full viewport minus 32px margin, capped at 380px
        'w-[min(calc(100vw-32px),380px)]',
        // Height: no more than 80% of viewport height
        'max-h-[min(420px,calc(100dvh-80px))]',
        // Padding scales with screen size
        'p-3 sm:p-4 md:p-5',
      )}
    >
      <button
        type="button"
        {...skipProps}
        aria-label={skipLabel}
        title={skipLabel}
        className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200 sm:right-3 sm:top-3 sm:h-8 sm:w-8"
      >
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      </button>

      <header className="flex shrink-0 items-start gap-2 border-b border-gray-100 pb-2.5 pr-8 dark:border-white/10 sm:pb-3 sm:pr-9">
        <Sparkles className="mt-px h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" style={{ color: 'var(--org-accent-color, var(--color-accent))' }} aria-hidden="true" />
        <h2 className="break-words text-sm font-semibold leading-snug text-gray-900 dark:text-white">
          {step.title}
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-3 pr-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:py-4">
        <div className="break-words">{step.content}</div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-white/10 sm:gap-3 sm:pt-4">
        <TourProgress current={index} total={size} />

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {index > 0 ? (
            <button
              type="button"
              {...backProps}
              aria-label={backLabel}
              title={backLabel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </button>
          ) : null}

          <button
            type="button"
            {...primaryProps}
            className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-9 sm:px-4"
            style={{ backgroundColor: 'var(--org-accent-color, var(--color-accent))', color: 'var(--org-on-action-color, var(--color-primary))' }}
          >
            <span>{primaryLabel}</span>
            {!isLastStep ? <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" /> : null}
          </button>
        </div>
      </footer>
    </section>
  )
}
