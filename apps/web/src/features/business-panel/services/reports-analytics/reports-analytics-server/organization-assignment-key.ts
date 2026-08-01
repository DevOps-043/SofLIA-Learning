export function organizationAssignmentKey(userId: string, courseId: string): string {
  return `${userId}:${courseId}`
}
