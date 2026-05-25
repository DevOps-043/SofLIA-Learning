import { z } from 'zod'

import type { CalculateAvailabilityRequest } from './calculate-availability/calculate-availability.service'
import type { AnalyzeCalendarRequest } from './calendar/analyze/analyze-calendar.types'
import type { InsertEventsRequest } from './calendar/insert-events/insert-events-format.service'
import type { SyncSessionsRequestBody } from './calendar/sync-sessions/sync-sessions.types'
import { parseSyncSessionsRequest } from './calendar/sync-sessions/sync-sessions.utils'
import type { ParsedDashboardChatRequest } from './dashboard/chat/chat-request.service'
import { parseDashboardChatRequest } from './dashboard/chat/chat-request.service'
import type { ChatRequest } from './dashboard/chat/types'
import type { CalendarEventRouteBody } from './events/[id]/event-route.types'
import type { Lesson, Preferences } from './generate-plan/generate-plan.types'
import type { StudyPlanApplyPatchRequest } from './plan/apply-patch/study-plan-apply-patch.types'
import { parseStudyPlanApplyPatchRequest } from './plan/apply-patch/study-plan-apply-patch.utils'
import type { SavePlanRequest } from './save-plan/save-plan.types'
import type { UpdateSessionRequest } from './sessions/update/study-planner-session-update.types'
import { parseUpdateSessionRequest } from './sessions/update/study-planner-session-update.utils'
import type { ValidateSessionTimesRequest } from './validate-session-times/validate-session-times.service'

const MAX_SHORT_TEXT = 300
const MAX_LONG_TEXT = 5_000
const MAX_PROMPT_TEXT = 50_000
const MAX_TIMEZONE_LENGTH = 100

const nonEmptyString = (max = MAX_SHORT_TEXT) => z.string().min(1).max(max)
const optionalString = (max = MAX_SHORT_TEXT) => z.string().max(max).optional()
const providerSchema = z.enum(['google', 'microsoft'])
const dayOfWeekSchema = z.number().int().min(0).max(6)

function parsedBy<T>(
  parser: (value: unknown) => T,
  fallbackMessage: string,
) {
  return z.unknown().transform((value, ctx): T => {
    try {
      return parser(value)
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : fallbackMessage,
      })
      return z.NEVER
    }
  })
}

const timeBlockSchema = z.object({
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59),
  dayOfWeek: dayOfWeekSchema.optional(),
})

const calendarEventSchema = z.object({
  id: nonEmptyString(500),
  title: nonEmptyString(500),
  description: optionalString(MAX_LONG_TEXT),
  startTime: nonEmptyString(100),
  endTime: nonEmptyString(100),
  isAllDay: z.boolean(),
  isRecurring: z.boolean(),
  location: optionalString(500),
  status: z.enum(['confirmed', 'tentative', 'cancelled']),
  calendarId: optionalString(500),
}).passthrough()

export const calculateAvailabilitySchema: z.ZodType<CalculateAvailabilityRequest> = z.object({
  calendarEvents: z.array(calendarEventSchema).max(500).optional(),
  preferredDays: z.array(dayOfWeekSchema).max(7).optional(),
  preferredTimeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
})
export type CalculateAvailabilityBody = z.infer<typeof calculateAvailabilitySchema>

export const analyzeCalendarSchema: z.ZodType<AnalyzeCalendarRequest> = z.object({
  startDate: optionalString(100),
  endDate: optionalString(100),
  preferredDays: z.array(dayOfWeekSchema).max(7).optional(),
  minSessionMinutes: z.number().positive().max(480).optional(),
  maxSessionMinutes: z.number().positive().max(480).optional(),
})
export type AnalyzeCalendarBody = z.infer<typeof analyzeCalendarSchema>

export const connectCalendarSchema = z.object({
  provider: providerSchema,
})
export type ConnectCalendarBody = z.infer<typeof connectCalendarSchema>

export const disconnectCalendarSchema = z.object({
  provider: providerSchema.optional(),
})
export type DisconnectCalendarBody = z.infer<typeof disconnectCalendarSchema>

export const deletePlanEventsSchema = z.object({
  planId: nonEmptyString(200),
})
export type DeletePlanEventsBody = z.infer<typeof deletePlanEventsSchema>

const lessonItemSchema = z.object({
  courseTitle: nonEmptyString(500),
  lessonTitle: nonEmptyString(500),
  lessonOrderIndex: z.number().int().min(0),
  durationMinutes: z.number().nonnegative().max(24 * 60),
  moduleTitle: optionalString(500),
})

export const insertEventsSchema: z.ZodType<InsertEventsRequest> = z.object({
  lessonDistribution: z.array(z.object({
    slot: z.object({
      date: nonEmptyString(100),
      start: nonEmptyString(100),
      end: nonEmptyString(100),
      dayName: nonEmptyString(100),
      durationMinutes: z.number().nonnegative().max(24 * 60),
    }),
    lessons: z.array(lessonItemSchema).max(200),
  })).min(1).max(200),
  timezone: nonEmptyString(MAX_TIMEZONE_LENGTH),
  planName: optionalString(500),
})
export type InsertEventsBody = z.infer<typeof insertEventsSchema>

export const calendarSelectionSchema = z.object({
  selectedCalendarIds: z.array(nonEmptyString(500)).min(1).max(100),
  provider: providerSchema.optional(),
})
export type CalendarSelectionBody = z.infer<typeof calendarSelectionSchema>

export const syncSessionsSchema = z.unknown().transform((payload, ctx): SyncSessionsRequestBody => {
  const parsed = parseSyncSessionsRequest(payload as SyncSessionsRequestBody)

  if (parsed.error || !parsed.data) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: parsed.error || 'sessionIds es requerido y debe ser un array no vacio',
    })
    return z.NEVER
  }

  return parsed.data
})
export type SyncSessionsBody = z.infer<typeof syncSessionsSchema>

const dashboardActionTypeSchema = z.enum([
  'move_session',
  'delete_session',
  'resize_session',
  'create_session',
  'update_session',
  'complete_session',
  'reschedule_sessions',
])

export const dashboardActionSchema = z.object({
  action: dashboardActionTypeSchema,
  planId: nonEmptyString(200),
  data: z.unknown().optional(),
})
export type DashboardActionBody = z.infer<typeof dashboardActionSchema>

export const dashboardChatSchema = z.unknown().transform((payload, ctx): ParsedDashboardChatRequest => {
  const parsed = parseDashboardChatRequest(payload as ChatRequest)

  if (parsed.error || !parsed.data) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: parsed.error?.error || 'Payload invalido',
    })
    return z.NEVER
  }

  return parsed.data
})
export type DashboardChatBody = z.infer<typeof dashboardChatSchema>

export const confirmActionSchema = z.object({
  action: nonEmptyString(100),
  data: z.record(z.string(), z.unknown()).optional(),
  planId: nonEmptyString(200),
  traceId: optionalString(200),
  userMessage: optionalString(MAX_PROMPT_TEXT),
})
export type ConfirmActionBody = z.infer<typeof confirmActionSchema>

export const calendarEventMutationSchema: z.ZodType<CalendarEventRouteBody> = z.object({
  title: nonEmptyString(500),
  description: optionalString(MAX_LONG_TEXT),
  start: nonEmptyString(100),
  end: nonEmptyString(100),
  location: optionalString(500),
  isAllDay: z.boolean().optional(),
  color: optionalString(100),
})
export type CalendarEventMutationBody = z.infer<typeof calendarEventMutationSchema>

const lessonSchema: z.ZodType<Lesson> = z.object({
  lessonId: nonEmptyString(200),
  lessonTitle: nonEmptyString(500),
  moduleTitle: nonEmptyString(500),
  durationMinutes: z.number().nonnegative().max(24 * 60),
})

const freeSlotSchema = z.object({
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59),
})

const preferencesSchema: z.ZodType<Preferences> = z.object({
  days: z.array(nonEmptyString(50)).max(7),
  times: z.array(nonEmptyString(50)).max(10),
  startDate: optionalString(100),
  studyMode: z.enum(['pomodoro', 'balanced', 'intensive']).optional(),
  maxConsecutiveHours: z.number().positive().max(24).optional(),
  calendarStartTimesByDay: z.record(z.string(), nonEmptyString(20)).optional(),
  calendarEndTimesByDay: z.record(z.string(), nonEmptyString(20)).optional(),
  availabilityMap: z.record(
    z.string(),
    z.object({
      freeSlots: z.array(freeSlotSchema).max(100).optional(),
    }),
  ).optional(),
  allowSunday: z.boolean().optional(),
})

export const generatePlanSchema = z.object({
  lessons: z.array(lessonSchema).min(1).max(1_000),
  preferences: preferencesSchema,
  deadlineDate: optionalString(100),
  maxSessionMinutes: z.number().positive().max(480).optional(),
})
export type GeneratePlanBody = z.infer<typeof generatePlanSchema>

export const lessonTrackingCompleteSchema = z.object({
  trackingId: optionalString(200),
  lessonId: optionalString(200),
  endTrigger: z.enum(['quiz_submitted', 'context_changed', 'manual']),
}).refine((body) => Boolean(body.trackingId || body.lessonId), {
  message: 'trackingId o lessonId es requerido',
})
export type LessonTrackingCompleteBody = z.infer<typeof lessonTrackingCompleteSchema>

export const lessonTrackingEventSchema = z.object({
  trackingId: nonEmptyString(200),
  eventType: z.enum(['video_ended', 'lia_message', 'activity']),
})
export type LessonTrackingEventBody = z.infer<typeof lessonTrackingEventSchema>

export const lessonTrackingStartSchema = z.object({
  lessonId: nonEmptyString(200),
  sessionId: optionalString(200),
  planId: optionalString(200),
  trigger: z.enum(['video_play', 'page_load', 'manual']).optional(),
  lessonTimeEstimates: z.object({
    t_lesson_minutes: z.number().nonnegative().max(24 * 60),
    t_video_minutes: z.number().nonnegative().max(24 * 60),
    t_materials_minutes: z.number().nonnegative().max(24 * 60),
  }).optional(),
})
export type LessonTrackingStartBody = z.infer<typeof lessonTrackingStartSchema>

export const studyPlanApplyPatchSchema = parsedBy<StudyPlanApplyPatchRequest>(
  parseStudyPlanApplyPatchRequest,
  'Payload de patch invalido',
)
export type StudyPlanApplyPatchBody = z.infer<typeof studyPlanApplyPatchSchema>

export const deletePlanSchema = z.object({
  planId: optionalString(200),
})
export type DeletePlanBody = z.infer<typeof deletePlanSchema>

const sofLiaAvailabilityAnalysisSchema = z.object({
  estimatedWeeklyMinutes: z.number().nonnegative(),
  suggestedMinSessionMinutes: z.number().nonnegative(),
  suggestedMaxSessionMinutes: z.number().nonnegative(),
  suggestedBreakMinutes: z.number().nonnegative(),
  suggestedDays: z.array(dayOfWeekSchema).max(7),
  suggestedTimeBlocks: z.array(timeBlockSchema).max(100),
  reasoning: nonEmptyString(MAX_LONG_TEXT),
  factorsConsidered: z.object({
    role: nonEmptyString(MAX_LONG_TEXT),
    area: nonEmptyString(MAX_LONG_TEXT),
    companySize: nonEmptyString(MAX_LONG_TEXT),
    level: nonEmptyString(MAX_LONG_TEXT),
    calendarAnalysis: optionalString(MAX_LONG_TEXT),
  }),
  analyzedAt: nonEmptyString(100),
})

const sofLiaTimeAnalysisSchema = z.object({
  totalEstimatedMinutes: z.number().nonnegative(),
  courseBreakdown: z.array(z.object({
    courseId: nonEmptyString(200),
    courseTitle: nonEmptyString(500),
    estimatedMinutes: z.number().nonnegative(),
    complexity: z.number().nonnegative(),
  })).max(500),
  sessionDistribution: z.object({
    totalSessions: z.number().int().nonnegative(),
    sessionsPerWeek: z.number().nonnegative(),
    weeksToComplete: z.number().nonnegative(),
  }),
  meetsDeadlines: z.boolean().optional(),
  deadlineWarnings: z.array(z.object({
    courseId: nonEmptyString(200),
    courseTitle: nonEmptyString(500),
    dueDate: nonEmptyString(100),
    estimatedCompletionDate: nonEmptyString(100),
    isAtRisk: z.boolean(),
    suggestedAction: nonEmptyString(MAX_LONG_TEXT),
  })).max(500).optional(),
  reasoning: nonEmptyString(MAX_LONG_TEXT),
  analyzedAt: nonEmptyString(100),
})

const studyPlanConfigSchema = z.object({
  name: nonEmptyString(500),
  description: optionalString(MAX_LONG_TEXT),
  userType: z.enum(['b2b', 'b2c']),
  courseIds: z.array(nonEmptyString(200)).min(1).max(50),
  organizationId: z.string().max(200).nullable().optional(),
  learningRouteId: optionalString(200),
  goalHoursPerWeek: z.number().positive().max(168),
  startDate: optionalString(100),
  endDate: optionalString(100),
  timezone: nonEmptyString(MAX_TIMEZONE_LENGTH),
  preferredDays: z.array(dayOfWeekSchema).min(1).max(7),
  preferredTimeBlocks: z.array(timeBlockSchema).max(50),
  minSessionMinutes: z.number().positive().max(480),
  maxSessionMinutes: z.number().positive().max(480),
  breakDurationMinutes: z.number().nonnegative().max(240),
  preferredSessionType: z.enum(['short', 'medium', 'long']),
  generationMode: z.enum(['manual', 'ai_generated']),
  sofLiaAvailabilityAnalysis: sofLiaAvailabilityAnalysisSchema.optional(),
  sofLiaTimeAnalysis: sofLiaTimeAnalysisSchema.optional(),
  calendarAnalyzed: z.boolean(),
  calendarProvider: providerSchema.optional(),
}).passthrough()

const plannedLessonSchema = z.object({
  courseId: optionalString(200),
  courseTitle: nonEmptyString(500),
  lessonId: optionalString(200),
  lessonTitle: nonEmptyString(500),
  lessonOrderIndex: z.number().int().min(0),
  durationMinutes: z.number().nonnegative().max(24 * 60),
  moduleTitle: optionalString(500),
  moduleOrderIndex: z.number().int().min(0).optional(),
}).passthrough()

const savePlanSessionSchema = z.object({
  id: optionalString(200),
  planId: optionalString(200),
  userId: optionalString(200),
  title: nonEmptyString(500),
  description: optionalString(MAX_LONG_TEXT),
  clientReferenceId: optionalString(200),
  courseId: optionalString(200),
  lessonId: optionalString(200),
  lessonTitle: optionalString(500),
  plannedLessons: z.array(plannedLessonSchema).max(500).optional(),
  startTime: nonEmptyString(100),
  endTime: nonEmptyString(100),
  durationMinutes: z.number().nonnegative().max(24 * 60).optional(),
  breakDurationMinutes: z.number().nonnegative().max(240).optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'missed', 'rescheduled']).optional(),
  isAiGenerated: z.boolean().optional(),
  sofLiaSuggested: z.boolean().optional(),
  sessionType: z.enum(['short', 'medium', 'long']).optional(),
  dueDate: optionalString(100),
  calendarConflictChecked: z.boolean().optional(),
}).passthrough()

export const savePlanSchema: z.ZodType<SavePlanRequest> = z.object({
  config: studyPlanConfigSchema,
  sessions: z.array(savePlanSessionSchema).min(1).max(500),
})
export type SavePlanBody = z.infer<typeof savePlanSchema>

export const updateSessionsSchema = parsedBy<UpdateSessionRequest>(
  parseUpdateSessionRequest,
  'Payload de actualizacion invalido',
)
export type UpdateSessionsBody = z.infer<typeof updateSessionsSchema>

export const suggestLearningRouteSchema = z.object({
  includeUnpurchasedCourses: z.boolean().optional(),
  focusArea: optionalString(300),
  targetSkills: z.array(nonEmptyString(200)).max(50).optional(),
  maxCourses: z.number().int().positive().max(50).optional(),
})
export type SuggestLearningRouteBody = z.infer<typeof suggestLearningRouteSchema>

export const validateSessionTimesSchema: z.ZodType<ValidateSessionTimesRequest> = z.object({
  courseIds: z.array(nonEmptyString(200)).min(1).max(50),
  minSessionMinutes: z.number().positive().max(480),
  maxSessionMinutes: z.number().positive().max(480),
  breakDurationMinutes: z.number().nonnegative().max(240),
  preferredDays: z.array(dayOfWeekSchema).min(1).max(7),
  preferredTimeBlocks: z.array(timeBlockSchema).min(1).max(50),
  calendarEvents: z.array(calendarEventSchema).max(500).optional(),
  goalHoursPerWeek: z.number().positive().max(168).optional(),
})
export type ValidateSessionTimesBody = z.infer<typeof validateSessionTimesSchema>
