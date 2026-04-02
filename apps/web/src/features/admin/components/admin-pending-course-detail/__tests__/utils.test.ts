import { describe, expect, it } from 'vitest';
import {
  formatCourseDurationHours,
  getFieldLabel,
  parseMaterialContent,
  resolveVideoEmbedUrl,
  truncateFieldValue,
} from '../utils';

describe('admin-pending-course-detail utils', () => {
  it('formats course duration in hours with one decimal', () => {
    expect(formatCourseDurationHours(95)).toBe(1.6);
  });

  it('builds supported video embed urls', () => {
    expect(resolveVideoEmbedUrl('youtube', 'https://youtu.be/abc123')).toBe('https://www.youtube.com/embed/abc123');
    expect(resolveVideoEmbedUrl('vimeo', 'https://vimeo.com/987654')).toBe('https://player.vimeo.com/video/987654');
    expect(resolveVideoEmbedUrl('other', 'asset')).toBeNull();
  });

  it('maps known field labels and truncates values safely', () => {
    expect(getFieldLabel('title')).toBe('Título');
    expect(getFieldLabel('unknown_field')).toBe('unknown_field');
    expect(truncateFieldValue(null)).toBe('(vacío)');
    expect(truncateFieldValue('a'.repeat(120), 10)).toBe('aaaaaaaaaa…');
  });

  it('parses interactive material content safely', () => {
    expect(parseMaterialContent('{"ok":true}')).toEqual({
      error: null,
      parsedContent: { ok: true },
    });
    expect(parseMaterialContent('{')).toEqual({
      error: 'Error parsing content',
      parsedContent: null,
    });
  });
});
