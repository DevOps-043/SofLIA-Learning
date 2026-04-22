export function resolveStudyPlannerCourseId(selectionId: string): string {
  return selectionId.split('__')[0] || selectionId
}

export function resolveStudyPlannerCourseIds(selectionIds: string[]): string[] {
  return selectionIds.map(resolveStudyPlannerCourseId)
}
