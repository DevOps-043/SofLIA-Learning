import { describe, expect, it } from 'vitest'

import { buildActivities } from '../build-activities'
import { buildBusinessUserAnalyticsPeriod } from '../build-business-user-analytics-period'
import { buildDialogueActivityMetrics } from '../dialogue-activity-metrics'
import type { ActivityEvaluationRecord } from '../activity-evaluation-record'
import type { ActivitySubmissionRecord } from '../activity-submission-record'
import type { DialogueResultRecord } from '../dialogue-result-record'
import type { DialogueSessionRecord } from '../dialogue-session-record'
import type { QueryData } from '../query-data'

const PERIOD = buildBusinessUserAnalyticsPeriod('30d')
const NO_EVALUATIONS = new Map<string, ActivityEvaluationRecord>()
const NO_COMPLETED_COURSES = new Set<string>()

function dialogueResult(overrides: Partial<DialogueResultRecord> = {}): DialogueResultRecord {
  return {
    result_id: overrides.result_id ?? `res-${Math.random().toString(36).slice(2)}`,
    session_id: overrides.session_id ?? 'session-1',
    activity_id: overrides.activity_id ?? 'activity-1',
    user_id: overrides.user_id ?? 'user-1',
    enrollment_id: overrides.enrollment_id ?? 'enrollment-1',
    activity_result: overrides.activity_result ?? 'needs_retry',
    score: overrides.score ?? 0,
    criteria_met: overrides.criteria_met ?? [],
    criteria_missing: overrides.criteria_missing ?? [],
    student_feedback: overrides.student_feedback ?? null,
    created_at: overrides.created_at ?? '2026-06-01T00:00:00.000Z',
  }
}

function dialogueSession(overrides: Partial<DialogueSessionRecord> = {}): DialogueSessionRecord {
  return {
    session_id: overrides.session_id ?? 'session-1',
    activity_id: overrides.activity_id ?? 'activity-1',
    course_id: overrides.course_id ?? 'course-1',
    lesson_id: overrides.lesson_id ?? 'lesson-1',
    enrollment_id: overrides.enrollment_id ?? 'enrollment-1',
    organization_id: overrides.organization_id ?? 'org-1',
    user_id: overrides.user_id ?? 'user-1',
    state: overrides.state ?? 'START',
    current_score: overrides.current_score ?? null,
    turns_count: overrides.turns_count ?? 0,
    completed_at: overrides.completed_at ?? null,
    started_at: overrides.started_at ?? '2026-06-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-06-01T00:00:00.000Z',
  }
}

function submission(overrides: Partial<ActivitySubmissionRecord> = {}): ActivitySubmissionRecord {
  return {
    submission_id: overrides.submission_id ?? `sub-${Math.random().toString(36).slice(2)}`,
    course_id: overrides.course_id ?? 'course-1',
    enrollment_id: overrides.enrollment_id ?? 'enrollment-1',
    activity_id: overrides.activity_id ?? 'activity-1',
    organization_id: overrides.organization_id ?? 'org-1',
    status: overrides.status ?? 'validated',
    response_text: overrides.response_text ?? null,
    response_payload: overrides.response_payload ?? {},
    submitted_at: overrides.submitted_at ?? '2026-06-01T00:00:00.000Z',
    last_validated_at: overrides.last_validated_at ?? null,
    created_at: overrides.created_at ?? '2026-06-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-06-01T00:00:00.000Z',
  }
}

function queryData(overrides: Partial<QueryData> = {}): QueryData {
  return {
    assignments: [],
    enrollments: [],
    courseLessons: [],
    lessonActivities: [],
    lessonProgress: [],
    activitySubmissions: [],
    activityCompletions: [],
    activityEvaluations: [],
    dialogueResults: [],
    dialogueSessions: [],
    dialogueTurns: [],
    liaConversations: [],
    liaMessages: [],
    studySessions: [],
    lessonNotes: [],
    quizSubmissions: [],
    quizAttempts: [],
    quizLessonIds: [],
    certificates: [],
    userSessions: [],
    lessonTracking: [],
    ...overrides,
  }
}

describe('buildDialogueActivityMetrics', () => {
  it('deduplica varios intentos de la misma actividad en una sola entrega con el mejor score', () => {
    const metrics = buildDialogueActivityMetrics(
      [
        dialogueResult({ result_id: 'r1', activity_id: 'a', score: 8, activity_result: 'needs_retry' }),
        dialogueResult({ result_id: 'r2', activity_id: 'a', score: 40, activity_result: 'needs_retry' }),
      ],
      [],
    )

    expect(metrics.entregas).toBe(1)
    expect(metrics.passes).toBe(0)
    expect(metrics.qualityScores).toEqual([40])
  })

  it('prefiere el resultado completado aunque tenga menor score', () => {
    const metrics = buildDialogueActivityMetrics(
      [
        dialogueResult({ result_id: 'r1', activity_id: 'a', score: 95, activity_result: 'needs_retry' }),
        dialogueResult({ result_id: 'r2', activity_id: 'a', score: 70, activity_result: 'completed' }),
      ],
      [],
    )

    expect(metrics.entregas).toBe(1)
    expect(metrics.passes).toBe(1)
    expect(metrics.qualityScores).toEqual([70])
  })

  it('ignora sesiones solo abiertas (0 turnos, score 0) sin resultado', () => {
    const metrics = buildDialogueActivityMetrics(
      [],
      [dialogueSession({ session_id: 's1', activity_id: 'c', enrollment_id: 'e1', turns_count: 0, current_score: 0 })],
    )

    expect(metrics.entregas).toBe(0)
    expect(metrics.inProgress).toBe(0)
  })

  it('cuenta una sesion con interaccion real (>=1 turno) como entrega en progreso', () => {
    const metrics = buildDialogueActivityMetrics(
      [],
      [dialogueSession({ session_id: 's1', activity_id: 'c', enrollment_id: 'e1', turns_count: 3, current_score: 17 })],
    )

    expect(metrics.entregas).toBe(1)
    expect(metrics.inProgress).toBe(1)
    expect(metrics.passes).toBe(0)
    expect(metrics.qualityScores).toEqual([17])
  })

  it('no doble-cuenta la actividad si tiene resultado Y sesiones (usa el resultado)', () => {
    const metrics = buildDialogueActivityMetrics(
      [dialogueResult({ activity_id: 'c', enrollment_id: 'e1', score: 35, activity_result: 'needs_retry' })],
      [
        dialogueSession({ activity_id: 'c', enrollment_id: 'e1', turns_count: 8, current_score: 35 }),
        dialogueSession({ activity_id: 'c', enrollment_id: 'e1', turns_count: 0, current_score: 0 }),
      ],
    )

    expect(metrics.entregas).toBe(1)
    expect(metrics.needsRevision).toBe(1)
    expect(metrics.qualityScores).toEqual([35])
  })

  it('cuenta el feedback solo cuando student_feedback no esta vacio', () => {
    const metrics = buildDialogueActivityMetrics(
      [
        dialogueResult({ activity_id: 'a', student_feedback: 'Buen trabajo' }),
        dialogueResult({ activity_id: 'b', student_feedback: '   ' }),
        dialogueResult({ activity_id: 'd', student_feedback: null }),
      ],
      [],
    )

    expect(metrics.withFeedback).toBe(1)
  })
})

describe('buildActivities con actividades de dialogo', () => {
  it('usa el score real (no el proxy 55) y cuenta el feedback de SofLIA', () => {
    const data = queryData({
      dialogueResults: [
        dialogueResult({ activity_id: 'a', score: 8, activity_result: 'needs_retry', student_feedback: 'Sigue intentando' }),
      ],
    })

    const result = buildActivities(data, PERIOD, NO_EVALUATIONS, NO_COMPLETED_COURSES)

    expect(result.totalSubmissions).toBe(1)
    expect(result.averageQualityScore).toBe(8)
    expect(result.passRate).toBe(0)
    expect(result.withSofliaFeedback).toBe(1)
  })

  it('no doble-cuenta la submission-proxy generada por el sync del dialogo', () => {
    const data = queryData({
      dialogueResults: [
        dialogueResult({ activity_id: 'a', enrollment_id: 'e1', score: 90, activity_result: 'completed', student_feedback: 'Excelente' }),
      ],
      // Submission proxy creada por syncDialogueResultToActivitySubmission para la MISMA actividad.
      activitySubmissions: [submission({ activity_id: 'a', enrollment_id: 'e1', status: 'validated' })],
    })

    const result = buildActivities(data, PERIOD, NO_EVALUATIONS, NO_COMPLETED_COURSES)

    expect(result.totalSubmissions).toBe(1)
    expect(result.averageQualityScore).toBe(90)
    expect(result.passRate).toBe(100)
    expect(result.withSofliaFeedback).toBe(1)
  })

  it('refleja el caso real: 1 resultado + 3 sesiones con interaccion + opens vacios = 4 entregas', () => {
    const data = queryData({
      dialogueResults: [
        dialogueResult({ activity_id: 'a1', enrollment_id: 'e1', score: 35, activity_result: 'needs_retry', student_feedback: 'Reintenta' }),
      ],
      dialogueSessions: [
        // la del resultado (no debe sumar otra entrega)
        dialogueSession({ activity_id: 'a1', enrollment_id: 'e1', turns_count: 8, current_score: 35 }),
        // 3 con interaccion real, sin resultado
        dialogueSession({ activity_id: 'a2', enrollment_id: 'e1', turns_count: 1, current_score: 17 }),
        dialogueSession({ activity_id: 'a3', enrollment_id: 'e1', turns_count: 4, current_score: 8 }),
        dialogueSession({ activity_id: 'a4', enrollment_id: 'e2', turns_count: 1, current_score: 10 }),
        // 4 abiertas sin escribir nada -> ignoradas
        dialogueSession({ activity_id: 'a5', enrollment_id: 'e1', turns_count: 0, current_score: 0 }),
        dialogueSession({ activity_id: 'a6', enrollment_id: 'e1', turns_count: 0, current_score: 0 }),
        dialogueSession({ activity_id: 'a7', enrollment_id: 'e2', turns_count: 0, current_score: 0 }),
        dialogueSession({ activity_id: 'a8', enrollment_id: 'e2', turns_count: 0, current_score: 0 }),
      ],
      // submission-proxy del resultado a1 (no debe doble-contar)
      activitySubmissions: [submission({ activity_id: 'a1', enrollment_id: 'e1', status: 'needs_revision' })],
    })

    const result = buildActivities(data, PERIOD, NO_EVALUATIONS, NO_COMPLETED_COURSES)

    expect(result.totalSubmissions).toBe(4)
    expect(result.passRate).toBe(0)
    // Calidad = promedio de [35, 17, 8, 10] = 17.5
    expect(result.averageQualityScore).toBe(17.5)
    expect(result.withSofliaFeedback).toBe(1)
  })

  it('suma actividades de dialogo y entregas no-dialogo sin mezclarlas', () => {
    const data = queryData({
      dialogueResults: [
        dialogueResult({ activity_id: 'a', enrollment_id: 'e1', score: 80, activity_result: 'completed', student_feedback: 'ok' }),
      ],
      activitySubmissions: [submission({ activity_id: 'b', enrollment_id: 'e1', status: 'validated' })],
    })

    const result = buildActivities(data, PERIOD, NO_EVALUATIONS, NO_COMPLETED_COURSES)

    expect(result.totalSubmissions).toBe(2)
    // Calidad = promedio de [80 (dialogo real), 100 (submission validada)] = 90
    expect(result.averageQualityScore).toBe(90)
    expect(result.passRate).toBe(100)
  })
})
