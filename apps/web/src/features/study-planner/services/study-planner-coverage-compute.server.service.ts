import type { Database } from '@/lib/supabase/types';
import type { StudyPlannerCourseCoverage, StudyPlannerCoverageStatus } from './study-planner-coverage.types';

type Json = Database['public']['Tables']['study_sessions']['Row']['metrics'];

interface SessionLike {
  course_id: string | null;
  id: string;
  lesson_id: string | null;
  metrics: Json;
  status: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(readString).filter((v): v is string => Boolean(v)) : [];
}

export function extractPlannedLessonIdsFromSession(
  session: Pick<SessionLike, 'course_id' | 'lesson_id' | 'metrics'>,
): string[] {
  const lessonIds = new Set<string>();
  const directId = readString(session.lesson_id);
  if (directId) lessonIds.add(directId);

  const metrics = isRecord(session.metrics) ? session.metrics : {};
  for (const lessonId of readStringArray(metrics.plannedLessonIds)) lessonIds.add(lessonId);

  const plannedLessons = metrics.plannedLessons;
  if (Array.isArray(plannedLessons)) {
    for (const lesson of plannedLessons) {
      if (!isRecord(lesson)) continue;
      const lessonCourseId = readString(lesson.courseId);
      if (lessonCourseId && session.course_id && lessonCourseId !== session.course_id) continue;
      const lessonId = readString(lesson.lessonId);
      if (lessonId) lessonIds.add(lessonId);
    }
  }

  return Array.from(lessonIds);
}

export function computeStudyPlannerCourseCoverage({
  completedLessonIds,
  courseId,
  courseTitle,
  lessons,
  plannedSessionIdsByLessonId,
}: {
  completedLessonIds: Set<string>;
  courseId: string;
  courseTitle: string;
  lessons: Array<{ lessonId: string; lessonOrderIndex: number; lessonTitle: string; moduleId: string; moduleOrderIndex: number; moduleTitle: string }>;
  plannedSessionIdsByLessonId: Map<string, Set<string>>;
}): StudyPlannerCourseCoverage {
  const coverageLessons = lessons.map((lesson) => {
    const sessionIds = Array.from(plannedSessionIdsByLessonId.get(lesson.lessonId) || []);
    return { ...lesson, courseId, isCompleted: completedLessonIds.has(lesson.lessonId), isPlanned: sessionIds.length > 0, sessionIds };
  });

  const totalLessons = coverageLessons.length;
  const completedLessons = coverageLessons.filter((l) => l.isCompleted).length;
  const plannedLessons = coverageLessons.filter((l) => l.isPlanned).length;
  const unplannedLessons = totalLessons - plannedLessons;
  const coverageStatus: StudyPlannerCoverageStatus = totalLessons === 0 ? 'no_lessons' : unplannedLessons === 0 ? 'covered' : plannedLessons === 0 ? 'empty' : 'partial';

  return { completedLessons, courseId, courseTitle, coverageStatus, coveredBySessions: plannedLessons, lessons: coverageLessons, pendingLessons: totalLessons - completedLessons, plannedLessons, totalLessons, unplannedLessons };
}
