'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { TooltipRenderProps } from 'react-joyride';
import { X, ChevronRight, ChevronLeft, CheckCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FIXED_LEFT_TOOLTIP_DOCK = 'fixed-left';
const FIXED_LEFT_TOOLTIP_OFFSET = 24;
const MIN_FIXED_LEFT_TOOLTIP_TOP = 96;
const MAX_FIXED_LEFT_TOOLTIP_HEIGHT = 280;
const DEFAULT_FIXED_LEFT_TOOLTIP_TOP = 140;

type JoyrideTooltipData = {
  icon?: React.ReactNode;
  tooltipDock?: typeof FIXED_LEFT_TOOLTIP_DOCK;
  tooltipWidth?: 'compact';
};

type JoyrideTooltipElementProps = TooltipRenderProps['tooltipProps'] & {
  className?: string;
  style?: React.CSSProperties;
};

type JoyrideButtonElementProps = TooltipRenderProps['closeProps'] & {
  className?: string;
};

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ')
}

function isJoyrideTooltipData(value: unknown): value is JoyrideTooltipData {
  return typeof value === 'object' && value !== null;
}

function isSmallViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 640;
}

function resolveTooltipWidthClass(stepData: unknown, compactViewport: boolean): string {
  if (compactViewport) {
    return 'w-[calc(100vw-24px)] max-w-[360px]';
  }

  if (isJoyrideTooltipData(stepData) && stepData.tooltipWidth === 'compact') {
    return 'w-[calc(100vw-48px)] sm:w-[320px] max-w-[320px]';
  }

  return 'w-[90vw] sm:w-[380px] max-w-sm';
}

function shouldUseFixedLeftDock(stepData: unknown): boolean {
  return isJoyrideTooltipData(stepData) && stepData.tooltipDock === FIXED_LEFT_TOOLTIP_DOCK;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveStepTarget(step: TooltipRenderProps['step']): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  if (typeof step.target === 'string') {
    const target = document.querySelector(step.target);
    return target instanceof HTMLElement ? target : null;
  }

  return step.target instanceof HTMLElement ? step.target : null;
}

function resolveFixedLeftTooltipStyle(
  step: TooltipRenderProps['step'],
): React.CSSProperties {
  if (typeof window === 'undefined') {
    return {
      left: FIXED_LEFT_TOOLTIP_OFFSET,
      position: 'fixed',
      top: DEFAULT_FIXED_LEFT_TOOLTIP_TOP,
      transform: 'none',
    };
  }

  const targetElement = resolveStepTarget(step);
  const targetTop = targetElement?.getBoundingClientRect().top ?? DEFAULT_FIXED_LEFT_TOOLTIP_TOP;
  const maxTop = Math.max(
    MIN_FIXED_LEFT_TOOLTIP_TOP,
    window.innerHeight - MAX_FIXED_LEFT_TOOLTIP_HEIGHT,
  );

  return {
    left: FIXED_LEFT_TOOLTIP_OFFSET,
    position: 'fixed',
    top: clamp(targetTop + FIXED_LEFT_TOOLTIP_OFFSET, MIN_FIXED_LEFT_TOOLTIP_TOP, maxTop),
    transform: 'none',
  };
}

/**
 * Custom Joyride tooltip component with responsive light/dark mode styling.
 * Note: Using function declaration instead of React.FC to avoid React 18/19 type incompatibility
 * with react-joyride library.
 */
export function JoyrideTooltip({
  backProps,
  closeProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  skipProps,
  step,
  tooltipProps,
  size,
}: TooltipRenderProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const fixedLeftDock = shouldUseFixedLeftDock(step.data);
  const compactViewport = isSmallViewport();
  const resolvedTooltipProps = tooltipProps as JoyrideTooltipElementProps;
  const resolvedBackProps = backProps as JoyrideButtonElementProps;
  const resolvedCloseProps = closeProps as JoyrideButtonElementProps;
  const resolvedPrimaryProps = primaryProps as JoyrideButtonElementProps;
  const tooltipContent = (
    <div
      {...resolvedTooltipProps}
      className={joinClassNames(
        resolvedTooltipProps.className,
        'relative flex flex-col overflow-hidden border-0 bg-white dark:bg-[#1E2329] text-gray-900 dark:text-white z-[100003]',
        compactViewport ? 'rounded-[20px] max-h-[80vh]' : 'rounded-2xl max-h-[85vh]',
        resolveTooltipWidthClass(step.data, compactViewport)
      )}
      style={{
        ...(resolvedTooltipProps.style ?? {}),
        ...(fixedLeftDock ? resolveFixedLeftTooltipStyle(step) : {}),
        boxShadow: compactViewport
          ? '0 14px 34px -16px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.05)'
          : '0 20px 50px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none bg-[#00D4B3]"
      />

      {/* Header */}
      <div
        className={joinClassNames(
          'flex items-start justify-between relative z-10 shrink-0',
          compactViewport ? 'p-4 pb-0 mb-3' : 'p-6 pb-0 mb-4',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={joinClassNames(
              'flex items-center justify-center rounded-xl text-xl shrink-0 bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30',
              compactViewport ? 'w-9 h-9' : 'w-10 h-10',
            )}
          >
            {step.data?.icon || <Sparkles className="w-5 h-5 text-[#00D4B3]" />}
          </div>
          <h3
            className={joinClassNames(
              'font-bold leading-tight text-gray-900 dark:text-white',
              compactViewport ? 'text-base' : 'text-lg',
            )}
          >
            {step.title && typeof step.title === 'object' && 'props' in step.title 
              ? step.title.props.children[1]?.props?.children || step.title
              : step.title}
          </h3>
        </div>

        <button
          {...resolvedCloseProps}
          type="button"
          className={joinClassNames(
            resolvedCloseProps.className,
            'p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0 text-gray-400 dark:text-gray-500 cursor-pointer'
          )}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div
        className={joinClassNames(
          'leading-relaxed opacity-90 prose prose-slate dark:prose-invert max-w-none overflow-y-auto custom-scrollbar text-gray-600 dark:text-gray-300',
          compactViewport ? 'px-4 text-[13px]' : 'px-6 text-sm',
        )}
      >
        {step.content}
      </div>

      {/* Footer / Controls */}
      <div
        className={joinClassNames(
          'flex items-center justify-between mt-auto border-t shrink-0 relative z-10 bg-inherit border-gray-100 dark:border-white/10',
          compactViewport ? 'p-4 pt-3' : 'p-6 pt-4',
        )}
      >
        {/* Progress */}
        <div className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
          <span>{index + 1}</span>
          <span className="opacity-50">/</span>
          <span>{size}</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...resolvedBackProps}
              type="button"
              className={joinClassNames(
                resolvedBackProps.className,
                'flex items-center justify-center rounded-lg font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white cursor-pointer',
                compactViewport ? 'px-2.5 py-2 text-[13px]' : 'px-3 py-2 text-sm',
              )}
            >
              <ChevronLeft size={16} />
              <span className="ml-1">{t('actions.back')}</span>
            </button>
          )}

          {continuous && (
            <button
              {...resolvedPrimaryProps}
              type="button"
              className={joinClassNames(
                resolvedPrimaryProps.className,
                'flex items-center justify-center rounded-lg font-bold transition-all hover:brightness-110 bg-[#0A2540] text-white cursor-pointer',
                compactViewport
                  ? 'px-3 py-2 text-[13px] shadow-md shadow-[#0A2540]/25'
                  : 'px-4 py-2 text-sm shadow-lg shadow-[#0A2540]/40',
              )}
            >
              {isLastStep ? (
                <>
                  <CheckCircle size={16} className="mr-1.5" />
                  {t('actions.finish')}
                </>
              ) : (
                <>
                  {t('actions.next')}
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (fixedLeftDock && typeof document !== 'undefined') {
    return createPortal(tooltipContent, document.body);
  }

  return tooltipContent;
};
