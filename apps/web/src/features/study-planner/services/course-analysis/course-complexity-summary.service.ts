import type {
  CourseComplexity,
  CourseInfo,
  CourseModule,
} from '../../types/user-context.types';
import { buildCourseComplexity } from './calculations';
import { fetchCourseLessonDurations } from './duration.service';

export async function buildCourseComplexitySummary(
  courseId: string,
  courseInfo: CourseInfo,
  modules: CourseModule[],
): Promise<CourseComplexity> {
  const durations = await fetchCourseLessonDurations(modules);
  const totalLessons = modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0,
  );
  const totalDurationMinutes = durations.reduce(
    (sum, duration) => sum + duration.totalMinutes,
    0,
  );
  const averageLessonDuration =
    durations.length > 0 ? totalDurationMinutes / durations.length : 0;

  return buildCourseComplexity({
    courseId,
    level: courseInfo.level,
    category: courseInfo.category,
    totalLessons,
    totalModules: modules.length,
    totalDurationMinutes,
    averageLessonDuration,
  });
}
