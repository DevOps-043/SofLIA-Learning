import { describe, expect, it } from 'vitest'

import {
  persistActivitySubmissionPayload,
  type ActivitySubmissionMutationPayload,
} from '../activity-submission.server.service'

const basePayload: ActivitySubmissionMutationPayload = {
  activity_id: 'activity-1',
  course_id: 'course-1',
  enrollment_id: 'enrollment-1',
  evidence_payload: null,
  last_validated_at: null,
  lesson_id: 'lesson-1',
  organization_id: 'organization-1',
  response_payload: { text: 'Respuesta' },
  response_text: 'Respuesta',
  status: 'submitted',
  submitted_at: '2026-05-11T12:00:00.000Z',
  updated_at: '2026-05-11T12:00:00.000Z',
  user_id: 'user-1',
}

function createSubmissionClient(existingSubmissionId: string | null) {
  const calls: Array<{ operation: string; payload?: unknown }> = []

  const client = {
    from: (_tableName: string) => ({
      select: (_columns: string) => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: existingSubmissionId
                      ? { submission_id: existingSubmissionId }
                      : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
      update: (payload: unknown) => {
        calls.push({ operation: 'update', payload })

        return {
          eq: (_column: string, value: string) => ({
            select: (columns: string) => ({
              single: async () => ({
                data: {
                  selectedColumns: columns,
                  submission_id: value,
                },
                error: null,
              }),
            }),
          }),
        }
      },
      insert: (payload: unknown) => {
        calls.push({ operation: 'insert', payload })

        return {
          select: (columns: string) => ({
            single: async () => ({
              data: {
                selectedColumns: columns,
                submission_id: 'new-submission',
              },
              error: null,
            }),
          }),
        }
      },
    }),
  }

  return { calls, client }
}

describe('persistActivitySubmissionPayload', () => {
  it('inserts a submission when the current database has no existing row', async () => {
    const { calls, client } = createSubmissionClient(null)

    const result = await persistActivitySubmissionPayload(
      client as Parameters<typeof persistActivitySubmissionPayload>[0],
      basePayload,
      'submission_id',
    )

    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      selectedColumns: 'submission_id',
      submission_id: 'new-submission',
    })
    expect(calls).toEqual([
      {
        operation: 'insert',
        payload: basePayload,
      },
    ])
  })

  it('updates the latest submission instead of relying on an upsert conflict target', async () => {
    const { calls, client } = createSubmissionClient('existing-submission')

    const result = await persistActivitySubmissionPayload(
      client as Parameters<typeof persistActivitySubmissionPayload>[0],
      basePayload,
      'submission_id',
    )

    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      selectedColumns: 'submission_id',
      submission_id: 'existing-submission',
    })
    expect(calls).toEqual([
      {
        operation: 'update',
        payload: basePayload,
      },
    ])
  })
})
