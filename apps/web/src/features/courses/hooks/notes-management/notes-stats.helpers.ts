import type { LearnNotesStats } from "../../components/learn/types";
import type { NotesStatsOperation } from "./types";

export function buildOptimisticNotesStats(
  previous: LearnNotesStats,
  operation: NotesStatsOperation,
  lessonId: string | undefined,
  totalLessons: number
): LearnNotesStats {
  if (operation === "update") {
    return {
      ...previous,
      lastUpdate: "Ahora",
    };
  }

  const currentTotal = previous.totalNotes || 0;
  const nextTotal =
    operation === "create" ? currentTotal + 1 : Math.max(0, currentTotal - 1);
  const previousLessonsWithNotes =
    parseInt(previous.lessonsWithNotes.split("/")[0] || "0", 10) || 0;

  let nextLessonsWithNotes = previousLessonsWithNotes;

  if (lessonId && operation === "create") {
    nextLessonsWithNotes = Math.min(previousLessonsWithNotes + 1, totalLessons);
  }

  if (lessonId && operation === "delete") {
    nextLessonsWithNotes = Math.max(previousLessonsWithNotes - 1, 0);
  }

  return {
    ...previous,
    totalNotes: nextTotal,
    lessonsWithNotes: `${nextLessonsWithNotes}/${totalLessons}`,
    lastUpdate: "Ahora",
  };
}
