import type {
  PendingLessonRef,
  ProposedCreate,
  SessionOrderEntry,
} from './lesson-order.types'

export function buildEntryForCreateProposal(params: {
  createProposal: ProposedCreate
  lessonMetadata: Map<string, PendingLessonRef>
  completedLessonIds: Set<string>
}): SessionOrderEntry | null {
  const { createProposal } = params
  if (!createProposal.courseId || !createProposal.lessonId) return null
  if (params.completedLessonIds.has(createProposal.lessonId)) return null

  const metadata = params.lessonMetadata.get(createProposal.lessonId)
  if (!metadata) return null

  return {
    sessionId: `new:${createProposal.lessonId}`,
    title: createProposal.title || 'Nueva sesi\u00f3n',
    courseId: createProposal.courseId,
    startTime: createProposal.startTime,
    sequence: {
      moduleOrderIndex: metadata.moduleOrderIndex,
      lessonOrderIndex: metadata.lessonOrderIndex,
    },
  }
}
