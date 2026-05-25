'use client';

import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';

import type { SchedulePreviewWeekRange } from './schedule-preview.types';

interface SchedulePreviewHeaderProps {
  weekRange: SchedulePreviewWeekRange;
  isLoadingExternal: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onClose: () => void;
}

export function SchedulePreviewHeader({
  weekRange,
  isLoadingExternal,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onClose,
}: SchedulePreviewHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-white/10">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPreviousWeek}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={14} />
        </button>

        <button
          type="button"
          onClick={onCurrentWeek}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Semana actual"
          title="Ir a semana del plan"
        >
          <RotateCcw size={12} />
        </button>

        <button
          type="button"
          onClick={onNextWeek}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Semana siguiente"
        >
          <ChevronRight size={14} />
        </button>

        <span className="ml-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          {weekRange.label}
        </span>

        {isLoadingExternal && (
          <span className="ml-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-accent" />
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Cerrar vista previa"
      >
        <X size={14} />
      </button>
    </div>
  );
}
