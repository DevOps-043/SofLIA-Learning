import type {
  StudyPlannerCourseOption,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types';

interface PlannerMyCourseRecord {
  course_id?: string | null;
  courses?: {
    slug?: string | null;
  } | null;
  id?: string | null;
  slug?: string | null;
}

interface PlannerMyCoursesPayload {
  courses?: PlannerMyCourseRecord[] | null;
}

interface PlannerMetadataLessonRecord {
  durationSeconds?: number | null;
  lessonId?: string | null;
  lessonOrderIndex?: number | null;
  lessonTitle?: string | null;
  totalDurationMinutes?: number | null;
}

interface PlannerMetadataModuleRecord {
  lessons?: PlannerMetadataLessonRecord[] | null;
  moduleOrderIndex?: number | null;
  moduleTitle?: string | null;
}

interface PlannerMetadataPayload {
  metadata?: {
    modules?: PlannerMetadataModuleRecord[] | null;
  } | null;
  modules?: PlannerMetadataModuleRecord[] | null;
  success?: boolean;
}

interface PlannerProgressPayload {
  completedLessonIds?: string[] | null;
}

interface PlannerMetadataLessonSummary {
  durationMinutes: number;
  lessonId: string;
  lessonOrderIndex: number;
  lessonTitle: string;
  moduleOrderIndex: number;
  moduleTitle: string;
}

interface ResolveStudyPlannerPendingLessonsInput {
  availableCourses: StudyPlannerCourseOption[];
  cachedPendingLessons: StudyPlannerPendingLesson[];
  fetchImpl?: typeof fetch;
  selectedCourseIds: string[];
  userId?: string;
}

function normalizeMyCourses(
  payload: PlannerMyCourseRecord[] | PlannerMyCoursesPayload,
): PlannerMyCourseRecord[] {
  return Array.isArray(payload) ? payload : payload.courses || [];
}

function sortPendingLessons(
  pendingLessons: StudyPlannerPendingLesson[],
  selectedCourseIds: string[],
): StudyPlannerPendingLesson[] {
  return [...pendingLessons].sort((left, right) => {
    if (left.courseId !== right.courseId) {
      return selectedCourseIds.indexOf(left.courseId) - selectedCourseIds.indexOf(right.courseId);
    }

    if (left.moduleOrderIndex !== right.moduleOrderIndex) {
      return left.moduleOrderIndex - right.moduleOrderIndex;
    }

    return left.lessonOrderIndex - right.lessonOrderIndex;
  });
}

function normalizeMetadataLessons(
  modules: PlannerMetadataModuleRecord[] | null | undefined,
): PlannerMetadataLessonSummary[] {
  const uniqueLessons = new Map<string, PlannerMetadataLessonSummary>();

  (modules || []).forEach((module, moduleIndex) => {
    (module.lessons || []).forEach((lesson, lessonIndex) => {
      if (!lesson.lessonId || !lesson.lessonTitle?.trim() || uniqueLessons.has(lesson.lessonId)) {
        return;
      }

      uniqueLessons.set(lesson.lessonId, {
        durationMinutes:
          lesson.totalDurationMinutes && lesson.totalDurationMinutes > 0
            ? lesson.totalDurationMinutes
            : lesson.durationSeconds && lesson.durationSeconds > 0
              ? Math.ceil(lesson.durationSeconds / 60)
              : 15,
        lessonId: lesson.lessonId,
        lessonOrderIndex: lesson.lessonOrderIndex && lesson.lessonOrderIndex > 0
          ? lesson.lessonOrderIndex
          : lessonIndex,
        lessonTitle: lesson.lessonTitle.trim(),
        moduleOrderIndex:
          typeof module.moduleOrderIndex === 'number' ? module.moduleOrderIndex : moduleIndex,
        moduleTitle: module.moduleTitle || `Modulo ${moduleIndex + 1}`,
      });
    });
  });

  return Array.from(uniqueLessons.values()).sort((left, right) => {
    if (left.moduleOrderIndex !== right.moduleOrderIndex) {
      return left.moduleOrderIndex - right.moduleOrderIndex;
    }

    return left.lessonOrderIndex - right.lessonOrderIndex;
  });
}

async function fetchCourseLessonSummary(
  courseId: string,
  fetchImpl: typeof fetch,
): Promise<PlannerMetadataLessonSummary[]> {
  const response = await fetchImpl(`/api/workshops/${courseId}/metadata`);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as PlannerMetadataPayload;
  return normalizeMetadataLessons(payload.metadata?.modules || payload.modules);
}

async function fetchCompletedLessonIds(
  courseId: string,
  fetchImpl: typeof fetch,
  userId?: string,
): Promise<Set<string>> {
  if (!userId) {
    return new Set();
  }

  try {
    const response = await fetchImpl(`/api/study-planner/course-progress?courseId=${courseId}`);
    if (!response.ok) {
      return new Set();
    }

    const payload = (await response.json()) as PlannerProgressPayload;
    return new Set(payload.completedLessonIds || []);
  } catch {
    return new Set();
  }
}

export async function resolveStudyPlannerPendingLessonsForRecommendations({
  availableCourses,
  cachedPendingLessons,
  fetchImpl = fetch,
  selectedCourseIds,
  userId,
}: ResolveStudyPlannerPendingLessonsInput): Promise<StudyPlannerPendingLesson[]> {
  if (cachedPendingLessons.length > 0) {
    return sortPendingLessons(cachedPendingLessons, selectedCourseIds);
  }

  if (selectedCourseIds.length === 0) {
    return [];
  }

  try {
    const myCoursesResponse = await fetchImpl('/api/my-courses');
    if (!myCoursesResponse.ok) {
      return [];
    }

    const myCoursesData = (await myCoursesResponse.json()) as
      | PlannerMyCourseRecord[]
      | PlannerMyCoursesPayload;
    const myCourses = normalizeMyCourses(myCoursesData);
    const availableCourseIds = new Set(
      myCourses
        .map((course) => course.course_id || course.id)
        .filter((courseId): courseId is string => Boolean(courseId)),
    );
    const pendingLessons: StudyPlannerPendingLesson[] = [];
    const addedLessonIds = new Set<string>();

    await Promise.all(
      selectedCourseIds
        .filter((courseId) => availableCourseIds.has(courseId))
        .map(async (courseId) => {
        const courseTitle =
          availableCourses.find((course) => course.id === courseId)?.title || 'Curso';
        const [courseLessons, completedLessonIds] = await Promise.all([
          fetchCourseLessonSummary(courseId, fetchImpl),
          fetchCompletedLessonIds(courseId, fetchImpl, userId),
        ]);

        courseLessons.forEach((lesson) => {
          if (addedLessonIds.has(lesson.lessonId) || completedLessonIds.has(lesson.lessonId)) {
            return;
          }

          addedLessonIds.add(lesson.lessonId);
          pendingLessons.push({
            courseId,
            courseTitle,
            durationMinutes: lesson.durationMinutes,
            lessonId: lesson.lessonId,
            lessonOrderIndex: lesson.lessonOrderIndex,
            lessonTitle: lesson.lessonTitle,
            moduleOrderIndex: lesson.moduleOrderIndex,
            moduleTitle: lesson.moduleTitle,
          });
        });
      }),
    );

    return sortPendingLessons(pendingLessons, selectedCourseIds);
  } catch {
    return [];
  }
}
