import type {
  CourseInfo,
} from './pending-lessons.types';

export function normalizeCourseInfo(
  value: CourseInfo | CourseInfo[] | null,
): CourseInfo | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}
