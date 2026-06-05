import { describe, expect, it } from 'vitest';

import { liaLiveTranscriptsSchema } from '../schema';

describe('lia live transcripts schema', () => {
  it('accepts a hidden live transcript payload', () => {
    const result = liaLiveTranscriptsSchema.safeParse({
      schemaVersion: 1,
      sessionId: '17805935-3110-4000-9000-000000000001',
      conversationId: '17805935-3110-4000-9000-000000000002',
      source: 'side_panel',
      outcome: 'completed',
      startedAt: '2026-06-05T12:00:00.000Z',
      endedAt: '2026-06-05T12:00:12.000Z',
      durationMs: 12_000,
      model: 'gemini-3.1-flash-live-preview',
      language: 'es',
      contextType: 'general',
      pageContext: { currentPage: '/business-user/dashboard' },
      metrics: {
        turnCount: 1,
        userTranscriptCount: 1,
        assistantTranscriptCount: 1,
        interruptionCount: 0,
        errorCount: 0,
      },
      entries: [
        { sequence: 1, role: 'user', content: 'Que puedo hacer aqui?' },
        { sequence: 2, role: 'assistant', content: 'Puedes revisar tus cursos.' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects transcripts that would end before they start', () => {
    const result = liaLiveTranscriptsSchema.safeParse({
      schemaVersion: 1,
      sessionId: '17805935-3110-4000-9000-000000000001',
      source: 'side_panel',
      outcome: 'completed',
      startedAt: '2026-06-05T12:00:12.000Z',
      endedAt: '2026-06-05T12:00:00.000Z',
      durationMs: 12_000,
      metrics: {
        turnCount: 0,
        userTranscriptCount: 0,
        assistantTranscriptCount: 0,
        interruptionCount: 0,
        errorCount: 0,
      },
      entries: [],
    });

    expect(result.success).toBe(false);
  });
});
