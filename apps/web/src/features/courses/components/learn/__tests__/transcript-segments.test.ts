import { describe, expect, it } from 'vitest';

import {
  alignTranscriptSegmentTimes,
  formatTimestamp,
  parseTimestampToSeconds,
  parseTranscriptSegments,
} from '../transcript-segments';

describe('parseTranscriptSegments', () => {
  it('extracts timestamped blocks', () => {
    const text = '[00:00] Bienvenidos.\n[00:45] La matriz.\n[03:00] Un ejemplo.';
    const segments = parseTranscriptSegments(text);

    expect(segments).toEqual([
      { time: '00:00', content: 'Bienvenidos.' },
      { time: '00:45', content: 'La matriz.' },
      { time: '03:00', content: 'Un ejemplo.' },
    ]);
  });

  it('keeps leading untimed text as a null-time block', () => {
    const segments = parseTranscriptSegments('Intro sin marca.\n[00:10] Con marca.');
    expect(segments[0]).toEqual({ time: null, content: 'Intro sin marca.' });
    expect(segments[1]).toEqual({ time: '00:10', content: 'Con marca.' });
  });

  it('returns empty array for empty input', () => {
    expect(parseTranscriptSegments('')).toEqual([]);
  });
});

describe('parseTimestampToSeconds / formatTimestamp', () => {
  it('parses mm:ss and h:mm:ss', () => {
    expect(parseTimestampToSeconds('00:45')).toBe(45);
    expect(parseTimestampToSeconds('05:30')).toBe(330);
    expect(parseTimestampToSeconds('1:00:00')).toBe(3600);
  });

  it('formats seconds back to m:ss / h:mm:ss', () => {
    expect(formatTimestamp(0)).toBe('0:00');
    expect(formatTimestamp(45)).toBe('0:45');
    expect(formatTimestamp(65)).toBe('1:05');
    expect(formatTimestamp(3661)).toBe('1:01:01');
  });
});

describe('alignTranscriptSegmentTimes', () => {
  const brokenSegments = [
    { time: '00:00', content: 'A'.repeat(150) },
    { time: '00:45', content: 'B'.repeat(150) },
    { time: '03:00', content: 'C'.repeat(150) },
    { time: '05:30', content: 'D'.repeat(150) },
  ];

  it('realigns timestamps that exceed the real video duration', () => {
    // Video real de 60s, pero las marcas llegan a 05:30 (330s).
    const aligned = alignTranscriptSegmentTimes(brokenSegments, 60);
    const seconds = aligned.map((s) => parseTimestampToSeconds(s.time as string));

    // Todas dentro de [0, 60] y monotonicas crecientes.
    expect(Math.max(...seconds)).toBeLessThanOrEqual(60);
    expect(seconds[0]).toBe(0);
    for (let i = 1; i < seconds.length; i += 1) {
      expect(seconds[i]).toBeGreaterThanOrEqual(seconds[i - 1]);
    }
  });

  it('leaves timestamps untouched when they already fit the duration', () => {
    const ok = [
      { time: '00:00', content: 'uno' },
      { time: '00:20', content: 'dos' },
    ];
    expect(alignTranscriptSegmentTimes(ok, 60)).toEqual(ok);
  });

  it('does nothing without a valid duration', () => {
    expect(alignTranscriptSegmentTimes(brokenSegments, 0)).toEqual(brokenSegments);
    expect(alignTranscriptSegmentTimes(brokenSegments, null)).toEqual(brokenSegments);
  });

  it('preserves untimed blocks', () => {
    const withIntro = [
      { time: null, content: 'Intro' },
      { time: '04:00', content: 'X'.repeat(100) },
    ];
    const aligned = alignTranscriptSegmentTimes(withIntro, 30);
    expect(aligned[0]).toEqual({ time: null, content: 'Intro' });
    expect(aligned[1].time).not.toBeNull();
  });
});
