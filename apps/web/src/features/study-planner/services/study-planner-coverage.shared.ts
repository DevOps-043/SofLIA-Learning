export type StudyPlannerCoverageStatus =
  | 'covered'
  | 'partial'
  | 'empty'
  | 'no_lessons';

export interface StudyPlannerCoverageLesson {
  courseId: string;
  isCompleted: boolean;
  isPlanned: boolean;
  lessonId: string;
  lessonOrderIndex: number;
  lessonTitle: string;
  moduleId: string;
  moduleOrderIndex: number;
  moduleTitle: string;
  sessionIds: string[];
}

export interface StudyPlannerCourseCoverage {
  completedLessons: number;
  courseId: string;
  courseTitle: string;
  coverageStatus: StudyPlannerCoverageStatus;
  coveredBySessions: number;
  lessons: StudyPlannerCoverageLesson[];
  pendingLessons: number;
  plannedLessons: number;
  totalLessons: number;
  unplannedLessons: number;
}

interface ComputeCourseCoverageParams {
  completedLessonIds: Set<string>;
  courseId: string;
  courseTitle: string;
  lessons: Array<{
    lessonId: string;
    lessonOrderIndex: number;
    lessonTitle: string;
    moduleId: string;
    moduleOrderIndex: number;
    moduleTitle: string;
  }>;
  plannedSessionIdsByLessonId: Map<string, Set<string>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map(readString)
        .filter((item): item is string => Boolean(item))
    : [];
}

function parseSessionMetrics(metrics: unknown): Record<string, unknown> {
  return isRecord(metrics) ? metrics : {};
}

export function extractPlannedLessonIdsFromSession(
  session: {
    course_id: string | null;
    lesson_id: string | null;
    metrics: unknown;
  },
): string[] {
  const lessonIds = new Set<string>();
  const directLessonId = readString(session.lesson_id);

  if (directLessonId) {
    lessonIds.add(directLessonId);
  }

  const metrics = parseSessionMetrics(session.metrics);
  for (const lessonId of readStringArray(metrics.plannedLessonIds)) {
    lessonIds.add(lessonId);
  }

  const plannedLessons = metrics.plannedLessons;
  if (Array.isArray(plannedLessons)) {
    for (const lesson of plannedLessons) {
      if (!isRecord(lesson)) {
        continue;
      }

      const lessonCourseId = readString(lesson.courseId);
      if (lessonCourseId && session.course_id && lessonCourseId !== session.course_id) {
        continue;
      }

      const lessonId = readString(lesson.lessonId);
      if (lessonId) {
        lessonIds.add(lessonId);
      }
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
}: ComputeCourseCoverageParams): StudyPlannerCourseCoverage {
  const coverageLessons = lessons.map((lesson) => {
    const sessionIds = Array.from(plannedSessionIdsByLessonId.get(lesson.lessonId) || []);
    return {
      ...lesson,
      courseId,
      isCompleted: completedLessonIds.has(lesson.lessonId),
      isPlanned: sessionIds.length > 0,
      sessionIds,
    };
  });

  const totalLessons = coverageLessons.length;
  const completedLessons = coverageLessons.filter((lesson) => lesson.isCompleted).length;
  const plannedLessons = coverageLessons.filter((lesson) => lesson.isPlanned).length;
  const unplannedLessons = totalLessons - plannedLessons;
  const pendingLessons = totalLessons - completedLessons;
  const coveredBySessions = plannedLessons;

  const coverageStatus: StudyPlannerCoverageStatus =
    totalLessons === 0
      ? 'no_lessons'
      : unplannedLessons === 0
        ? 'covered'
        : plannedLessons === 0
          ? 'empty'
          : 'partial';

  return {
    completedLessons,
    courseId,
    courseTitle,
    coverageStatus,
    coveredBySessions,
    lessons: coverageLessons,
    pendingLessons,
    plannedLessons,
    totalLessons,
    unplannedLessons,
  };
}
