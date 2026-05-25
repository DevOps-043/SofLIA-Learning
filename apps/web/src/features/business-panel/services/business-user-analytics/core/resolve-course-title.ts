export function resolveCourseTitle(courseTitleById: Map<string, string>, courseId: string): string {
  return courseTitleById.get(courseId) || courseId
}
