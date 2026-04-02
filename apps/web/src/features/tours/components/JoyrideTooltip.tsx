'use client';

import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { X, ChevronRight, ChevronLeft, CheckCircle, Sparkles } from 'lucide-react';

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
  // Extract onClick handlers to ensure they are called properly
  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (closeProps.onClick) {
      closeProps.onClick(e);
    }
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (backProps.onClick) {
      backProps.onClick(e);
    }
  };

  const handlePrimary = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (primaryProps.onClick) {
      primaryProps.onClick(e);
    }
  };

  return (
    <div
      ref={tooltipProps.ref as React.RefCallback<HTMLDivElement>}
      role={tooltipProps.role}
      aria-modal={tooltipProps['aria-modal']}
      className="relative flex flex-col rounded-2xl shadow-2xl overflow-hidden w-[90vw] sm:w-[380px] max-w-sm max-h-[85vh] border-0 bg-white dark:bg-[#1E2329] text-gray-900 dark:text-white z-[10001]"
      style={{
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
          type="button"
          onClick={handleClose}
          aria-label={closeProps['aria-label']}
          data-action="close"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0 text-gray-400 dark:text-gray-500 cursor-pointer"
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
              type="button"
              onClick={handleBack}
              aria-label={backProps['aria-label']}
              data-action="back"
              className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span className="ml-1">Anterior</span>
            </button>
          )}

          {continuous && (
            <button
              type="button"
              onClick={handlePrimary}
              aria-label={primaryProps['aria-label']}
              data-action={isLastStep ? 'close' : 'next'}
              className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 shadow-lg bg-[#0A2540] text-white shadow-[#0A2540]/40 cursor-pointer"
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
};
