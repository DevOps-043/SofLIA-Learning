import type { LessonInfo } from '../../types/user-context.types';
import { fetchLessonDurationMap } from './duration.service';

export async function calculateRemainingTimeFromLessons(
  pendingLessons: LessonInfo[],
): Promise<{
  totalRemainingMinutes: number;
  remainingLessons: number;
  estimatedSessionsNeeded: number;
}> {
  const durationMap = await fetchLessonDurationMap(
    pendingLessons.map((lesson) => lesson.lessonId),
  );
  const totalRemainingMinutes = pendingLessons.reduce(
    (totalMinutes, lesson) =>
      totalMinutes + (durationMap.get(lesson.lessonId)?.totalMinutes || 0),
    0,
  );

  return {
    totalRemainingMinutes,
    remainingLessons: pendingLessons.length,
    estimatedSessionsNeeded: Math.ceil(totalRemainingMinutes / 30),
  };
}
