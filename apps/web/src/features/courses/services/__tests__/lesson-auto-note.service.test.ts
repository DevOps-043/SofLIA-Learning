import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  buildLessonAutoNotePrompt,
  buildLessonAutoNotePromptInputFromRows,
  resolveLessonAutoNotePersistenceDecision,
} from '../lesson-auto-note.service'
import type { RequiredQuizStatus } from '../quiz/required-quiz-status.service'

describe('resolveLessonAutoNotePersistenceDecision', () => {
  it('creates when there is no existing automatic lesson note', () => {
    expect(
      resolveLessonAutoNotePersistenceDecision({
        allowUpdate: false,
        existingNoteId: null,
      }),
    ).toEqual({ action: 'create' })
  })

  it('skips an existing note when the new attempt should not update it', () => {
    expect(
      resolveLessonAutoNotePersistenceDecision({
        allowUpdate: false,
        existingNoteId: 'note-1',
      }),
    ).toEqual({ action: 'skip', noteId: 'note-1' })
  })

  it('updates the same note when an approved attempt improves the result', () => {
    expect(
      resolveLessonAutoNotePersistenceDecision({
        allowUpdate: true,
        existingNoteId: 'note-1',
      }),
    ).toEqual({ action: 'update', noteId: 'note-1' })
  })
})

describe('lesson auto-note prompt context', () => {
  const quizStatus: RequiredQuizStatus = {
    allQuizzesPassed: true,
    completedQuizzes: 1,
    hasRequiredQuizzes: true,
    passedQuizzes: 1,
    quizzes: [
      {
        completedAt: '2026-06-13T12:00:00.000Z',
        id: 'quiz-activity',
        isCompleted: true,
        isPassed: true,
        isRequired: true,
        latestSubmission: {
          completedAt: '2026-06-13T12:00:00.000Z',
          score: 1,
          submissionId: 'quiz-submission',
          userAnswers: { q1: 1 },
        },
        percentage: 100,
        title: 'Quiz final',
        type: 'activity',
      },
    ],
    totalRequiredQuizzes: 1,
  }

  it('builds concise context with video, reading, SofLIA dialogue, activity feedback, and quiz review', () => {
    const promptInput = buildLessonAutoNotePromptInputFromRows({
      activities: [
        {
          activity_config: null,
          activity_content: {
            questions: [
              {
                correctAnswer: 'Paris',
                explanation: 'Paris is the capital of France.',
                id: 'q1',
                options: ['Madrid', 'Paris'],
                question: 'What is the capital of France?',
                questionType: 'multiple_choice',
              },
            ],
          },
          activity_description: 'Checkpoint de comprension',
          activity_id: 'quiz-activity',
          activity_order_index: 2,
          activity_title: 'Quiz final',
          activity_type: 'quiz',
          ai_prompts: null,
          is_required: true,
        },
        {
          activity_config: null,
          activity_content: 'Reflexiona sobre como aplicar el concepto.',
          activity_description: 'Actividad reflexiva',
          activity_id: 'reflection-activity',
          activity_order_index: 1,
          activity_title: 'Reflexion aplicada',
          activity_type: 'reflection',
          ai_prompts: null,
          is_required: true,
        },
      ],
      courseTitle: 'Curso IA',
      dialogueResults: [
        {
          activity_id: 'reflection-activity',
          activity_result: 'complete',
          criteria_met: ['uso de concepto'],
          criteria_missing: [],
          instructor_summary: 'El usuario conecto el concepto con su trabajo.',
          score: 92,
          session_id: 'dialogue-session',
          student_feedback: 'Buen analisis; faltaria concretar un siguiente paso.',
        },
      ],
      dialogueSessions: [
        {
          activity_id: 'reflection-activity',
          completed_at: '2026-06-13T12:05:00.000Z',
          criteria_met: ['uso de concepto'],
          criteria_missing: [],
          current_score: 92,
          session_id: 'dialogue-session',
          state: 'COMPLETE',
          updated_at: '2026-06-13T12:05:00.000Z',
        },
      ],
      dialogueTurns: [
        {
          content: 'Creo que puedo usarlo para priorizar tareas.',
          role: 'user',
          session_id: 'dialogue-session',
          turn_number: 1,
        },
        {
          content: 'Buen enfoque; identifica primero el criterio de impacto.',
          role: 'assistant',
          session_id: 'dialogue-session',
          turn_number: 2,
        },
      ],
      evaluations: [
        {
          created_at: '2026-06-13T12:04:00.000Z',
          feedback_payload: {
            summary: 'La respuesta fue clara y aplicable.',
          },
          result_status: 'approved',
          submission_id: 'reflection-submission',
        },
      ],
      lesson: {
        lesson_description: 'Leccion sobre aplicacion estrategica.',
        lesson_id: 'lesson-1',
        lesson_title: 'Pensamiento aplicado',
        summary_content: 'El video explica como convertir conceptos en decisiones.',
        transcript_content: 'Primero se define el problema, luego se elige un criterio.',
      },
      liaConversations: [
        {
          activity_id: 'reflection-activity',
          conversation_id: 'lia-conversation',
          conversation_title: 'Chat de practica',
          total_user_messages: 2,
          updated_at: '2026-06-13T12:02:00.000Z',
        },
      ],
      liaMessages: [
        {
          content: 'Que criterio conviene elegir?',
          conversation_id: 'lia-conversation',
          message_sequence: 1,
          role: 'user',
        },
        {
          content: 'Elige el criterio que conecte impacto con factibilidad.',
          conversation_id: 'lia-conversation',
          message_sequence: 2,
          role: 'assistant',
        },
      ],
      materials: [
        {
          content_data: 'Lectura sobre criterios de decision.',
          material_description: 'Texto base de la leccion',
          material_id: 'reading-1',
          material_order_index: 1,
          material_title: 'Lectura estrategica',
          material_type: 'reading',
        },
      ],
      quizStatus,
      submissions: [
        {
          activity_id: 'reflection-activity',
          evidence_payload: null,
          response_payload: { reflection: 'Lo aplicaria priorizando por impacto.' },
          response_text: 'Lo aplicaria priorizando por impacto.',
          status: 'submitted',
          submission_id: 'reflection-submission',
          submitted_at: '2026-06-13T12:03:00.000Z',
          updated_at: '2026-06-13T12:03:00.000Z',
        },
      ],
    })

    expect(promptInput.lessonTitle).toBe('Pensamiento aplicado')
    expect(promptInput.lessonSummary).toContain('conceptos en decisiones')
    expect(promptInput.transcript).toContain('define el problema')
    expect(promptInput.activityNotes.join('\n')).toContain('Lectura estrategica')
    expect(promptInput.activityNotes.join('\n')).toContain('priorizando por impacto')
    expect(promptInput.dialogueHighlights.join('\n')).toContain('Usuario: Creo que puedo usarlo')
    expect(promptInput.dialogueHighlights.join('\n')).toContain('SofLIA: Buen enfoque')
    expect(promptInput.dialogueHighlights.join('\n')).toContain('Chat de practica')
    expect(promptInput.quizReviews.join('\n')).toContain('What is the capital of France?')
    expect(promptInput.quizReviews.join('\n')).toContain('Respuesta clave: Paris.')
  })

  it('uses the required structured JSON sections and rules in the generation prompt', () => {
    const prompt = buildLessonAutoNotePrompt({
      activityNotes: ['Actividad: respuesta del usuario y retroalimentacion.'],
      courseTitle: 'Curso IA',
      dialogueHighlights: ['SofLIA: fragmento clave. Usuario: accion propuesta.'],
      lessonDescription: 'Descripcion breve',
      lessonSummary: 'Resumen del video',
      lessonTitle: 'Leccion 1',
      quizReviews: ['Quiz final: 100% aprobado.'],
      transcript: 'Transcripcion del video',
    })

    expect(prompt).toContain('"strategicSummary": ["párrafo"]')
    expect(prompt).toContain('"lessonKeyPoints"')
    expect(prompt).toContain('"sofliaHighlights"')
    expect(prompt).toContain('"activityFeedback"')
    expect(prompt).toContain('"quizFeedback"')
    expect(prompt).toContain('"reviewChecklist"')
    expect(prompt).toContain('No inventes datos')
    expect(prompt).toContain('No copies la conversacion completa')
    expect(prompt).toContain('Transcripcion del video')
  })
})
