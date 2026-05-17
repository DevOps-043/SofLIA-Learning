import { resolveStudyPlannerCourseId, resolveStudyPlannerCourseIds } from './study-planner-course-id.shared';
import { normalizeCourseCollection } from './planner-course-workload.helpers';
import type {
  CalculateStudyPlannerCourseWorkloadInput,
  StudyPlannerModulesPayload,
  StudyPlannerMyCourseRecord,
  StudyPlannerMyCoursesPayload,
  StudyPlannerProgressPayload,
} from './planner-course-workload.types';

async function fetchRemainingLessonsForCourse(
  courseId: string,
  courses: StudyPlannerMyCourseRecord[],
): Promise<number> {
  const resolvedCourseId = resolveStudyPlannerCourseId(courseId);
  const courseData = courses.find((course) => (course.course_id || course.id) === resolvedCourseId);
  const courseSlug = courseData?.courses?.slug || courseData?.slug || null;
  const enrollmentId = courseData?.enrollment_id || '';

  if (!courseSlug) {
    return 10;
  }

  const [modulesResponse, progressResponse] = await Promise.all([
    fetch(`/api/courses/${courseSlug}/modules`),
    fetch(`/api/study-planner/course-progress?enrollmentId=${enrollmentId}&courseId=${resolvedCourseId}`),
  ]);

  if (!modulesResponse.ok) {
    return 10;
  }

  const modulesData = (await modulesResponse.json()) as StudyPlannerModulesPayload;
  const progressData = progressResponse.ok
    ? ((await progressResponse.json()) as StudyPlannerProgressPayload)
    : { completedLessonIds: [] };

  const uniqueLessons = new Map<string, { lessonId: string }>();

  (modulesData.modules || []).forEach((module) => {
    (module.lessons || []).forEach((lesson) => {
      const lessonId = lesson.lesson_id || lesson.lessonId;
      const lessonTitle = lesson.lesson_title || lesson.lessonTitle || '';
      const isPublished = lesson.is_published !== false;

      if (!lessonId || !lessonTitle || !isPublished || uniqueLessons.has(lessonId)) {
        return;
      }

      uniqueLessons.set(lessonId, { lessonId });
    });
  });

  const completedLessonIds = new Set(progressData.completedLessonIds || []);
  return Array.from(uniqueLessons.values()).filter((lesson) => !completedLessonIds.has(lesson.lessonId)).length;
}

export async function calculateStudyPlannerTotalLessonsNeeded(
  input: CalculateStudyPlannerCourseWorkloadInput,
): Promise<number> {
  if (input.selectedCourseIds.length === 0) {
    return 0;
  }

  try {
    const myCoursesResponse = await fetch('/api/my-courses');
    if (!myCoursesResponse.ok) {
      return input.selectedCourseIds.length * 10;
    }

    const myCoursesData = (await myCoursesResponse.json()) as StudyPlannerMyCourseRecord[] | StudyPlannerMyCoursesPayload;
    const courses = normalizeCourseCollection(myCoursesData);

    const courseLessonCounts = await Promise.all(
      resolveStudyPlannerCourseIds(input.selectedCourseIds).map(async (courseId) => {
        try {
          const remainingLessons = await fetchRemainingLessonsForCourse(courseId, courses);
          return remainingLessons > 0 ? remainingLessons : 10;
        } catch (error) {
          console.warn(`Error obteniendo carga academica del curso ${courseId}:`, error);
          return 10;
        }
      }),
    );

    const totalLessonsNeeded = courseLessonCounts.reduce((sum, total) => sum + total, 0);
    return totalLessonsNeeded > 0 ? totalLessonsNeeded : input.selectedCourseIds.length * 10;
  } catch (error) {
    console.warn('Error calculando carga academica del planner:', error);
    return input.selectedCourseIds.length * 10;
  }
}
