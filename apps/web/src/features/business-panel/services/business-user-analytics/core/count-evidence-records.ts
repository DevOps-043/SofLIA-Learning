import { QueryData } from './query-data'

export function countEvidenceRecords(data: QueryData): number {
  return (
    data.lessonProgress.length +
    data.activitySubmissions.length +
    data.activityCompletions.length +
    data.dialogueResults.length +
    data.dialogueTurns.length +
    data.liaMessages.length +
    data.lessonNotes.length +
    data.quizSubmissions.length +
    data.lessonTracking.length
  )
}
