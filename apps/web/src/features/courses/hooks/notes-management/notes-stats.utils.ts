import type { LearnNotesStats } from "../../components/learn/types";
import {
  formatNoteTimestamp,
  getDefaultNotesStats,
} from "../../components/learn/notes/utils";
import type { NotesStatsOperation } from "./types";

type NotesStatsApiResponse = {
  totalNotes?: number;
  lessonsWithNotes?: number;
  totalLessons?: number;
  lastUpdate?: string | null;
};

export function mapServerNotesStats(
  stats: NotesStatsApiResponse,
  totalLessons: number
): LearnNotesStats {
  const defaultStats = getDefaultNotesStats(totalLessons);

  return {
    totalNotes: stats.totalNotes || 0,
    lessonsWithNotes: `${stats.lessonsWithNotes || 0}/${stats.totalLessons || totalLessons}`,
    lastUpdate: stats.lastUpdate
      ? formatNoteTimestamp(stats.lastUpdate)
      : defaultStats.lastUpdate,
  };
}

export function updateNotesStatsOptimistically(
  previous: LearnNotesStats,
  operation: NotesStatsOperation,
  lessonId: string | undefined,
  totalLessons: number
): LearnNotesStats {
  if (operation === "update") {
    return { ...previous, lastUpdate: "Ahora" };
  }

  const currentTotal = previous.totalNotes || 0;
  const previousLessons =
    parseInt(previous.lessonsWithNotes.split("/")[0] || "0", 10) || 0;

  return {
    ...previous,
    totalNotes:
      operation === "create" ? currentTotal + 1 : Math.max(0, currentTotal - 1),
    lessonsWithNotes: `${getNextLessonsCount(
      previousLessons,
      operation,
      lessonId,
      totalLessons
    )}/${totalLessons}`,
    lastUpdate: "Ahora",
  };
}

function getNextLessonsCount(
  previousLessons: number,
  operation: NotesStatsOperation,
  lessonId: string | undefined,
  totalLessons: number
) {
  if (!lessonId) return previousLessons;
  if (operation === "create") return Math.min(previousLessons + 1, totalLessons);
  return Math.max(previousLessons - 1, 0);
}
