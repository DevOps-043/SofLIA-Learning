// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InteractiveActivityRenderer } from '../InteractiveActivityRenderer'
import type { LearnActivity } from '../../types'

function createJsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('InteractiveActivityRenderer', () => {
  const activity: LearnActivity = {
    activity_id: 'activity-soflia',
    activity_title: 'Actividad con SofLIA',
    activity_type: 'exercise',
    activity_content: 'Contesta el caso y pide revision.',
    activity_config: {
      interactionType: 'long_text',
      submission: {
        responsePlaceholder: 'Escribe tu respuesta.',
      },
      validation: {
        enabled: true,
        requiredForCompletion: true,
        rubric: [],
      },
    },
    activity_order_index: 1,
    is_required: true,
  }

  beforeEach(() => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url

      if (requestUrl.includes('/validate')) {
        return Promise.resolve(
          createJsonResponse({
            evaluation: {
              resultStatus: 'pass',
              summary: 'Respuesta correcta.',
              strengths: ['Clara'],
              improvements: [],
              suggestedNextStep: 'Continua.',
            },
            submission: {
              completionSatisfied: true,
              evidencePayload: null,
              lastValidatedAt: '2026-04-17T20:00:00.000Z',
              latestEvaluation: {
                createdAt: '2026-04-17T20:00:00.000Z',
                evaluationId: 'evaluation-1',
                feedback: {
                  resultStatus: 'pass',
                  summary: 'Respuesta correcta.',
                  strengths: ['Clara'],
                  improvements: [],
                  suggestedNextStep: 'Continua.',
                },
                resultStatus: 'pass',
              },
              responsePayload: {
                text: 'Mi respuesta validable',
              },
              responseText: 'Mi respuesta validable',
              status: 'validated',
              submissionId: 'submission-1',
              submittedAt: '2026-04-17T20:00:00.000Z',
              updatedAt: '2026-04-17T20:00:00.000Z',
            },
          }),
        )
      }

      return Promise.resolve(
        createJsonResponse({
          submission: null,
        }),
      )
    }) as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('persists SofLIA evaluation through the activity validation endpoint', async () => {
    const onSubmissionSaved = vi.fn()

    render(
      <InteractiveActivityRenderer
        activity={activity}
        lessonId="lesson-1"
        onSubmissionSaved={onSubmissionSaved}
        slug="course-slug"
      />,
    )

    const responseTextarea = await screen.findByPlaceholderText(
      'Escribe tu respuesta.',
    )
    fireEvent.change(responseTextarea, {
      target: { value: 'Mi respuesta validable' },
    })

    const evaluateButton = screen.getByRole('button', {
      name: /evaluar con soflia/i,
    })
    fireEvent.click(evaluateButton)

    await waitFor(() => {
      expect(onSubmissionSaved).toHaveBeenCalledTimes(1)
    })

    const validateCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([input]) => String(input).includes('/validate'),
    )

    expect(validateCall).toBeDefined()
    expect(JSON.parse(String(validateCall?.[1]?.body))).toMatchObject({
      responseText: 'Mi respuesta validable',
      responsePayload: {
        text: 'Mi respuesta validable',
      },
    })
  })
})
