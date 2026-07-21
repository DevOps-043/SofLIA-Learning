import type { ForensicEventType } from '@/features/admin/services/user-forensics/user-forensics.types'

/**
 * Presentación por tipo de evento forense: clave i18n del rótulo y color del punto en
 * la línea de tiempo. Centraliza el mapeo para no repetir switch en los componentes.
 */
export interface ForensicEventTypeMeta {
  labelKey: string
  dotClass: string
}

export const FORENSIC_EVENT_TYPE_META: Record<ForensicEventType, ForensicEventTypeMeta> = {
  login: { labelKey: 'login', dotClass: 'bg-blue-500' },
  course_assigned: { labelKey: 'courseAssigned', dotClass: 'bg-indigo-500' },
  learning_path_assigned: { labelKey: 'learningPathAssigned', dotClass: 'bg-violet-500' },
  course_enrolled: { labelKey: 'courseEnrolled', dotClass: 'bg-indigo-400' },
  lesson_started: { labelKey: 'lessonStarted', dotClass: 'bg-cyan-500' },
  lesson_completed: { labelKey: 'lessonCompleted', dotClass: 'bg-emerald-500' },
  video_watched: { labelKey: 'videoWatched', dotClass: 'bg-cyan-400' },
  note_created: { labelKey: 'noteCreated', dotClass: 'bg-rose-400' },
  lia_conversation: { labelKey: 'liaConversation', dotClass: 'bg-sky-500' },
  dialogue_started: { labelKey: 'dialogueStarted', dotClass: 'bg-teal-500' },
  dialogue_evaluation: { labelKey: 'dialogueEvaluation', dotClass: 'bg-amber-500' },
  dialogue_result: { labelKey: 'dialogueResult', dotClass: 'bg-teal-600' },
  dialogue_event: { labelKey: 'dialogueEvent', dotClass: 'bg-teal-400' },
  quiz_attempt: { labelKey: 'quizAttempt', dotClass: 'bg-orange-500' },
  activity_submission: { labelKey: 'activitySubmission', dotClass: 'bg-fuchsia-500' },
  lia_message: { labelKey: 'liaMessage', dotClass: 'bg-sky-500' },
  certificate_issued: { labelKey: 'certificateIssued', dotClass: 'bg-yellow-500' },
  lesson_feedback: { labelKey: 'lessonFeedback', dotClass: 'bg-rose-500' },
}

export function forensicEventTypeLabelKey(type: ForensicEventType): string {
  return `users.masterPanel.audit.eventTypes.${FORENSIC_EVENT_TYPE_META[type]?.labelKey ?? 'unknown'}`
}
