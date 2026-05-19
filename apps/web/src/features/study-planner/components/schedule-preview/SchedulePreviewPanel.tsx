'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types';
import { SchedulePreviewEmptyState } from './SchedulePreviewEmptyState';
import { SchedulePreviewHeader } from './SchedulePreviewHeader';
import { SchedulePreviewWeekGrid } from './SchedulePreviewWeekGrid';
import { useSchedulePreviewData } from './hooks/useSchedulePreviewData';

// ── Constants ──────────────────────────────────────────────────────────────

/** Swipe distance threshold to trigger open/close. */
const SWIPE_THRESHOLD = 60;
/** Width of the collapsed reopen tab (px). */
const TAB_WIDTH = 28;

// ── Legend ──────────────────────────────────────────────────────────────────

function SchedulePreviewLegend() {
  return (
    <div className="flex items-center gap-3 border-t border-gray-200 px-3 py-1.5 dark:border-white/10">
      <div className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-legacy-8e24aa)' }} />
        <span className="text-[10px] text-gray-500 dark:text-gray-400">Plan de estudio</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-legacy-0066cc)' }} />
        <span className="text-[10px] text-gray-500 dark:text-gray-400">Calendario</span>
      </div>
    </div>
  );
}

// ── Reopen Tab ─────────────────────────────────────────────────────────────

interface ReopenTabProps {
  onClick: () => void;
}

function SchedulePreviewReopenTab({ onClick }: ReopenTabProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-gray-200 bg-white/90 px-1 py-4 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-gray-800/90 dark:hover:bg-gray-700/90"
      style={{ width: `${TAB_WIDTH}px` }}
      aria-label="Abrir vista previa del calendario"
      title="Ver calendario"
    >
      <CalendarDays size={14} className="mx-auto text-[var(--color-legacy-8e24aa)]" />
    </motion.button>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface SchedulePreviewPanelProps {
  isOpen: boolean;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  connectedCalendar: 'google' | 'microsoft' | null;
  /** Called when user closes the panel (button or swipe). */
  onClose: () => void;
  /** Called when user reopens the panel (tab or swipe). */
  onOpen: () => void;
  /** When true, the collapsed reopen tab is shown. */
  showReopenTab: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export function SchedulePreviewPanel({
  isOpen,
  savedLessonDistribution,
  connectedCalendar,
  onClose,
  onOpen,
  showReopenTab,
}: SchedulePreviewPanelProps) {
  const {
    events,
    weekRange,
    weekDays,
    hours,
    today,
    hasEvents,
    isLoadingExternal,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useSchedulePreviewData({ savedLessonDistribution, connectedCalendar });

  // ── Swipe detection (edge swipe to open, panel swipe to close) ─────────
  const panelRef = useRef<HTMLDivElement>(null);
  const edgeTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Edge swipe: detect touches starting within 20px of right edge.
  useEffect(() => {
    if (isOpen) return;

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (touch && touch.clientX >= window.innerWidth - 20) {
        edgeTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const start = edgeTouchStartRef.current;
      if (!start) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = start.x - touch.clientX;
      const deltaY = Math.abs(start.y - touch.clientY);

      // Swipe left (from right edge) with enough horizontal distance and not too vertical.
      if (deltaX > SWIPE_THRESHOLD && deltaY < deltaX) {
        onOpen();
      }

      edgeTouchStartRef.current = null;
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onOpen]);

  // Framer-motion drag handler for closing (swipe panel to the right).
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        onClose();
      }
    },
    [onClose],
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Reopen tab (visible when panel is closed and showReopenTab is true) */}
      <AnimatePresence>
        {!isOpen && showReopenTab && (
          <SchedulePreviewReopenTab onClick={onOpen} />
        )}
      </AnimatePresence>

      {/* Overlay (mobile only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-[90vw] flex-col bg-white shadow-2xl dark:bg-gray-900 sm:w-[50%]"
          >
            {/* Drag indicator (mobile) */}
            <div className="flex justify-center py-1 sm:hidden">
              <div className="h-1 w-8 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            <SchedulePreviewHeader
              weekRange={weekRange}
              isLoadingExternal={isLoadingExternal}
              onPreviousWeek={goToPreviousWeek}
              onNextWeek={goToNextWeek}
              onCurrentWeek={goToCurrentWeek}
              onClose={onClose}
            />

            {hasEvents ? (
              <SchedulePreviewWeekGrid
                weekDays={weekDays}
                hours={hours}
                today={today}
                events={events}
              />
            ) : (
              <SchedulePreviewEmptyState />
            )}

            <SchedulePreviewLegend />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
