export function addCourseOption(
  options: Map<string, string>,
  courseId: string | null | undefined,
  title: string | null | undefined,
): void {
  if (!courseId) return
  options.set(courseId, title || courseId)
}
