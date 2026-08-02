import { describe, expect, it } from 'vitest';

import {
  consumeLiaChatStreamBuffer,
  isSafeLiaDownloadRequest,
  isSafeLiaNavigationTarget,
} from '../lia-chat-stream.service';

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

  it('preserves a navigation target on the final event', () => {
    const parsed = consumeLiaChatStreamBuffer(
      'data: {"done":true,"navigateTo":"/acme/business-panel/hierarchy"}\n\n',
    );

    expect(parsed.events).toEqual([{
      done: true,
      navigateTo: '/acme/business-panel/hierarchy',
    }]);
  });

  it('accepts only internal admin and business-panel navigation targets', () => {
    expect(isSafeLiaNavigationTarget('/admin/users?panelUser=user-1')).toBe(true);
    expect(isSafeLiaNavigationTarget('/acme/business-panel/hierarchy')).toBe(true);
    expect(isSafeLiaNavigationTarget('//evil.example')).toBe(false);
    expect(isSafeLiaNavigationTarget('https://evil.example')).toBe(false);
    expect(isSafeLiaNavigationTarget('/acme/business-user/dashboard')).toBe(false);
    expect(isSafeLiaNavigationTarget('/acme/business-panel/settings')).toBe(false);
    expect(isSafeLiaNavigationTarget('/admin/secrets')).toBe(false);
    expect(isSafeLiaNavigationTarget('/acme/business-panel/users?panel=stats&panelUser=user-1&search=a%40b.com')).toBe(true);
  });

  it('accepts only the authenticated analytics PDF download endpoint', () => {
    expect(isSafeLiaDownloadRequest({
      url: '/api/acme/business/reports-analytics/insights',
      method: 'POST',
      body: { locale: 'es', format: 'pdf' },
    })).toBe(true);
    expect(isSafeLiaDownloadRequest({
      url: 'https://evil.example/report.pdf',
      method: 'POST',
      body: { locale: 'es', format: 'pdf' },
    })).toBe(false);
    expect(isSafeLiaDownloadRequest({
      url: '/api/acme/business/users/export',
      method: 'POST',
      body: { locale: 'es', format: 'pdf' },
    })).toBe(false);
  });
});
