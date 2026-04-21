import type { CourseComplexity, CourseInfo } from '../../types/user-context.types';
import { fetchLessonDurationMap } from './duration.service';
import { buildCourseComplexityForCourse } from './complexity.service';
import { getCourseLessonIds, getCourseModulesMap } from './modules.service';

interface LearningRouteSuggestionUserProfile {
  rol?: string;
  area?: string;
  nivel?: string;
}

export async function prepareLearningRouteSuggestionData(params: {
  courses: CourseInfo[];
  userProfile: LearningRouteSuggestionUserProfile;
}): Promise<{
  courses: CourseInfo[];
  complexities: CourseComplexity[];
  userProfile: LearningRouteSuggestionUserProfile;
}> {
  const { courses, userProfile } = params;
  const uniqueCourses = Array.from(
    new Map(courses.map((course) => [course.id, course])).values(),
  );
  const modulesByCourseId = await getCourseModulesMap(
    uniqueCourses.map((course) => course.id),
  );
  const durationMap = await fetchLessonDurationMap(
    uniqueCourses.flatMap((course) =>
      getCourseLessonIds(modulesByCourseId.get(course.id) || []),
    ),
  );
  const complexities = uniqueCourses.map((course) =>
    buildCourseComplexityForCourse(
      course,
      modulesByCourseId.get(course.id) || [],
      durationMap,
    ),
  );

  return {
    courses,
    complexities,
    userProfile,
  };
}
