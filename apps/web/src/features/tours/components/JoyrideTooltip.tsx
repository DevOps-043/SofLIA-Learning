'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { TooltipRenderProps } from 'react-joyride';
import { X, ChevronRight, ChevronLeft, CheckCircle, Sparkles } from 'lucide-react';

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

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ')
}

function isJoyrideTooltipData(value: unknown): value is JoyrideTooltipData {
  return typeof value === 'object' && value !== null;
}

function resolveTooltipWidthClass(stepData: unknown): string {
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
  const fixedLeftDock = shouldUseFixedLeftDock(step.data);
  const tooltipContent = (
    <div
      {...tooltipProps}
      className={joinClassNames(
        tooltipProps.className,
        'relative flex flex-col rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] border-0 bg-white dark:bg-[#1E2329] text-gray-900 dark:text-white z-[10003]',
        resolveTooltipWidthClass(step.data)
      )}
      style={{
        ...(tooltipProps.style ?? {}),
        ...(fixedLeftDock ? resolveFixedLeftTooltipStyle(step) : {}),
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full pointer-events-none bg-[#00D4B3]"
      />

      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-0 mb-4 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl text-xl shrink-0 bg-[#00D4B3]/20 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30"
          >
            {step.data?.icon || <Sparkles className="w-5 h-5 text-[#00D4B3]" />}
          </div>
          <h3
            className="text-lg font-bold leading-tight text-gray-900 dark:text-white"
          >
            {step.title && typeof step.title === 'object' && 'props' in step.title 
              ? step.title.props.children[1]?.props?.children || step.title
              : step.title}
          </h3>
        </div>

        <button
          {...closeProps}
          type="button"
          className={joinClassNames(
            closeProps.className,
            'p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0 text-gray-400 dark:text-gray-500 cursor-pointer'
          )}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div
        className="px-6 text-sm leading-relaxed opacity-90 prose prose-slate dark:prose-invert max-w-none overflow-y-auto custom-scrollbar text-gray-600 dark:text-gray-300"
      >
        {step.content}
      </div>

      {/* Footer / Controls */}
      <div
        className="flex items-center justify-between mt-auto p-6 pt-4 border-t shrink-0 relative z-10 bg-inherit border-gray-100 dark:border-white/10"
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
              {...backProps}
              type="button"
              className={joinClassNames(
                backProps.className,
                'flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white cursor-pointer'
              )}
            >
              <ChevronLeft size={16} />
              <span className="ml-1">Anterior</span>
            </button>
          )}

          {continuous && (
            <button
              {...primaryProps}
              type="button"
              className={joinClassNames(
                primaryProps.className,
                'flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 shadow-lg bg-[#0A2540] text-white shadow-[#0A2540]/40 cursor-pointer'
              )}
            >
              {isLastStep ? (
                <>
                  <CheckCircle size={16} className="mr-1.5" />
                  Finalizar
                </>
              ) : (
                <>
                  Siguiente
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
