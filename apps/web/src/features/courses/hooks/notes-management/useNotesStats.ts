"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LearnNotesStats } from "../../components/learn/types";
import {
  formatNoteTimestamp,
  getDefaultNotesStats,
} from "../../components/learn/notes/utils";
import { buildOptimisticNotesStats } from "./notes-stats.helpers";
import type { NotesStatsOperation } from "./types";

interface UseNotesStatsParams {
  slug: string;
  totalLessons: number;
}

export function useNotesStats({ slug, totalLessons }: UseNotesStatsParams) {
  const [notesStats, setNotesStats] = useState<LearnNotesStats>({
    totalNotes: 0,
    lessonsWithNotes: "0/0",
    lastUpdate: "-",
  });
  const statsRefreshTimeoutRef = useRef<number | null>(null);

  const clearStatsRefreshTimeout = useCallback(() => {
    if (statsRefreshTimeoutRef.current !== null) {
      window.clearTimeout(statsRefreshTimeoutRef.current);
      statsRefreshTimeoutRef.current = null;
    }
  }, []);

  const initializeNotesStats = useCallback(() => {
    const defaultStats = getDefaultNotesStats(totalLessons);
    setNotesStats(previous => ({
      ...previous,
      lessonsWithNotes: defaultStats.lessonsWithNotes,
    }));
  }, [totalLessons]);

  const loadNotesStats = useCallback(async (courseSlug: string) => {
    const defaultStats = getDefaultNotesStats(totalLessons);

    try {
      const response = await fetch(`/api/courses/${courseSlug}/notes/stats`, {
        cache: "no-store",
        credentials: "include",
      });

      if (response.ok) {
        const stats = (await response.json()) as {
          totalNotes?: number;
          lessonsWithNotes?: number;
          totalLessons?: number;
          lastUpdate?: string | null;
        };
        setNotesStats({
          totalNotes: stats.totalNotes || 0,
          lessonsWithNotes: `${stats.lessonsWithNotes || 0}/${stats.totalLessons || totalLessons}`,
          lastUpdate: stats.lastUpdate
            ? formatNoteTimestamp(stats.lastUpdate)
            : defaultStats.lastUpdate,
        });
        return;
      }

      if (response.status === 401 || response.status === 404) {
        setNotesStats(defaultStats);
      }
    } catch {
      setNotesStats(defaultStats);
    }
  }, [totalLessons]);

  const scheduleNotesStatsRefresh = useCallback(() => {
    if (!slug) return;

    clearStatsRefreshTimeout();
    statsRefreshTimeoutRef.current = window.setTimeout(() => {
      void loadNotesStats(slug);
    }, 500);
  }, [clearStatsRefreshTimeout, loadNotesStats, slug]);

  const updateNotesStatsOptimized = useCallback(
    async (operation: NotesStatsOperation, lessonId?: string) => {
      if (!slug) return;

      setNotesStats(previous =>
        buildOptimisticNotesStats(previous, operation, lessonId, totalLessons)
      );
      scheduleNotesStatsRefresh();
    },
    [scheduleNotesStatsRefresh, slug, totalLessons]
  );

  useEffect(() => clearStatsRefreshTimeout, [clearStatsRefreshTimeout]);

  return {
    applyServerNotesStats: setNotesStats,
    initializeNotesStats,
    loadNotesStats,
    notesStats,
    updateNotesStatsOptimized,
  };
}
