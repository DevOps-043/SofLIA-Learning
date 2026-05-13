import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatVideoDuration,
  requestVideoDuration,
  shouldDetectVideoDuration,
  validateVideoFile,
} from '../video-provider-selector.service';

describe('video-provider-selector.service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates file size and mime type', () => {
    expect(validateVideoFile({ type: 'video/mp4', size: 1024 } as File)).toBeNull();
    expect(validateVideoFile({ type: 'video/webm', size: 1024 } as File)).toBeNull();
    expect(validateVideoFile({ type: 'application/pdf', size: 1024 } as File)).toContain('Tipo de video');
    expect(validateVideoFile({ type: 'video/quicktime', size: 1024 } as File)).toContain('MP4 o WebM');
    expect(validateVideoFile({ type: 'video/mp4', size: 1024 * 1024 * 1024 + 1 } as File)).toContain(
      '1GB'
    );
  });

  it('formats durations and decides when auto-detection is valid', () => {
    expect(formatVideoDuration(125)).toBe('2:05');
    expect(shouldDetectVideoDuration('youtube', 'abc123')).toBe(true);
    expect(shouldDetectVideoDuration('custom', 'nota-interna')).toBe(false);
  });

  it('requests hosted durations through the backend API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ duration: 321 }),
      })
    );

    await expect(requestVideoDuration('youtube', 'abc123')).resolves.toBe(321);
  });
});
