import { describe, expect, it } from 'vitest';

import { LiaLiveTranscriptBuffer } from '../transcript-buffer';

describe('LiaLiveTranscriptBuffer', () => {
  it('groups user and assistant snippets into hidden transcript turns', () => {
    const buffer = new LiaLiveTranscriptBuffer();

    buffer.appendUserTranscript('Hola');
    buffer.appendUserTranscript('Hola SofLIA');
    buffer.appendAssistantTranscript('Claro');
    buffer.appendAssistantTranscript('Claro, te ayudo.');
    buffer.completeTurn();

    expect(buffer.snapshot()).toEqual({
      entries: [
        { sequence: 1, role: 'user', content: 'Hola SofLIA' },
        { sequence: 2, role: 'assistant', content: 'Claro, te ayudo.' },
      ],
      metrics: {
        turnCount: 1,
        userTranscriptCount: 1,
        assistantTranscriptCount: 1,
        interruptionCount: 0,
      },
    });
  });

  it('records interruptions without duplicating repeated transcript fragments', () => {
    const buffer = new LiaLiveTranscriptBuffer();

    buffer.appendAssistantTranscript('Puedes revisar tus programas activos');
    buffer.appendAssistantTranscript('programas activos');
    buffer.markInterrupted();

    const snapshot = buffer.snapshot();

    expect(snapshot.entries).toEqual([
      {
        sequence: 1,
        role: 'assistant',
        content: 'Puedes revisar tus programas activos',
      },
    ]);
    expect(snapshot.metrics.interruptionCount).toBe(1);
  });
});
