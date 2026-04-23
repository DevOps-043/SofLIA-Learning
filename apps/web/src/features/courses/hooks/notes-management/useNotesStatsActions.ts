"use client";

import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { LearnNotesStats } from "../../components/learn/types";
import { getDefaultNotesStats } from "../../components/learn/notes/utils";
import { mapServerNotesStats, updateNotesStatsOptimistically } from "./notes-stats.utils";
import type { NotesStatsOperation } from "./types";

type UseNotesStatsActionsParams = {
  slug: string;
  totalLessons: number;
  setNotesStats: Dispatch<SetStateAction<LearnNotesStats>>;
  statsRefreshTimeoutRef: MutableRefObject<number | null>;
};

export function useNotesStatsActions({
  slug,
  totalLessons,
  setNotesStats,
  statsRefreshTimeoutRef,
}: UseNotesStatsActionsParams) {
  const clearStatsRefreshTimeout = useCallback(() => {
    if (statsRefreshTimeoutRef.current !== null) {
      window.clearTimeout(statsRefreshTimeoutRef.current);
      statsRefreshTimeoutRef.current = null;
    }
  }, [statsRefreshTimeoutRef]);

  const initializeNotesStats = useCallback(() => {
    const defaultStats = getDefaultNotesStats(totalLessons);
    setNotesStats((previous) => ({
      ...previous,
      lessonsWithNotes: defaultStats.lessonsWithNotes,
    }));
  }, [setNotesStats, totalLessons]);

  const applyServerNotesStats = useCallback(
    (stats: LearnNotesStats) => setNotesStats(stats),
    [setNotesStats]
  );

  const loadNotesStats = useCallback(
    async (courseSlug: string) => {
      const defaultStats = getDefaultNotesStats(totalLessons);

      try {
        const response = await fetch(`/api/courses/${courseSlug}/notes/stats`, {
          cache: "no-store",
          credentials: "include",
        });

        if (response.ok) {
          const stats = await response.json();
          setNotesStats(mapServerNotesStats(stats, totalLessons));
          return;
        }

        if (response.status === 401 || response.status === 404) {
          setNotesStats(defaultStats);
        }
      } catch (error) {
        console.warn('[useNotesStatsActions] loadNotesStats failed — falling back to default stats', error);
        setNotesStats(defaultStats);
      }
    },
    [setNotesStats, totalLessons]
  );

  const scheduleNotesStatsRefresh = useCallback(() => {
    if (!slug) return;

    clearStatsRefreshTimeout();
    statsRefreshTimeoutRef.current = window.setTimeout(() => {
      void loadNotesStats(slug);
    }, 500);
  }, [clearStatsRefreshTimeout, loadNotesStats, slug, statsRefreshTimeoutRef]);

  const updateNotesStatsOptimized = useCallback(
    async (operation: NotesStatsOperation, lessonId?: string) => {
      if (!slug) return;

      setNotesStats((previous) =>
        updateNotesStatsOptimistically(previous, operation, lessonId, totalLessons)
      );
      scheduleNotesStatsRefresh();
    },
    [scheduleNotesStatsRefresh, setNotesStats, slug, totalLessons]
  );

  return {
    applyServerNotesStats,
    clearStatsRefreshTimeout,
    initializeNotesStats,
    loadNotesStats,
    updateNotesStatsOptimized,
  };
}
