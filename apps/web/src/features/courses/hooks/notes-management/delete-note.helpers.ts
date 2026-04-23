export async function restoreNotesState(
  slug: string,
  loadCourseNotes: (courseSlug: string) => Promise<void>,
  loadNotesStats: (courseSlug: string) => Promise<void>
) {
  await loadCourseNotes(slug);
  await loadNotesStats(slug);
}
