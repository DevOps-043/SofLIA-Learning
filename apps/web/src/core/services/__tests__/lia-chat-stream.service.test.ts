import { describe, expect, it } from 'vitest';

import { consumeLiaChatStreamBuffer } from '../lia-chat-stream.service';

describe('lia chat stream parser', () => {
  it('keeps partial SSE events until the full event arrives', () => {
    const first = consumeLiaChatStreamBuffer('data: {"content":"Hola');

    expect(first.events).toEqual([]);
    expect(first.remainingBuffer).toBe('data: {"content":"Hola');

    const second = consumeLiaChatStreamBuffer(
      `${first.remainingBuffer} SofLIA","done":false}\n\n`,
    );

    expect(second.events).toEqual([{ content: 'Hola SofLIA', done: false }]);
    expect(second.remainingBuffer).toBe('');
  });

  it('parses multiple complete events and preserves the next partial tail', () => {
    const parsed = consumeLiaChatStreamBuffer(
      [
        'data: {"content":"Uno ","done":false}\n\n',
        'data: {"content":"dos","done":false}\n\n',
        'data: {"content":"tre',
      ].join(''),
    );

    expect(parsed.events).toEqual([
      { content: 'Uno ', done: false },
      { content: 'dos', done: false },
    ]);
    expect(parsed.remainingBuffer).toBe('data: {"content":"tre');
  });

  it('supports done sentinel payloads', () => {
    const parsed = consumeLiaChatStreamBuffer('data: [DONE]\n\n');

    expect(parsed.events).toEqual([{ done: true }]);
    expect(parsed.remainingBuffer).toBe('');
  });
});
