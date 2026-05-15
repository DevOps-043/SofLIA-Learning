import { afterEach, describe, expect, it } from 'vitest';
import { processStoredVideoForAdaptiveStreaming } from '../adaptive-video-transcoding.server';

const supabase = {
  storage: {
    from: () => ({
      download: async () => {
        throw new Error('download should not run');
      },
    }),
  },
} as never;

describe('adaptive-video-transcoding.server', () => {
  afterEach(() => {
    delete process.env.VIDEO_TRANSCODING_ENABLED;
    delete process.env.FFMPEG_PATH;
    delete process.env.FFPROBE_PATH;
  });

  it('returns the original video when adaptive transcoding is disabled', async () => {
    const result = await processStoredVideoForAdaptiveStreaming({
      bucket: 'course-videos',
      contentType: 'video/mp4',
      publicUrl: 'https://cdn.test/source.mp4',
      sizeBytes: 1024,
      sourcePath: 'videos/source.mp4',
      supabase,
    });

    expect(result.status).toBe('disabled');
    expect(result.playbackUrl).toBe('https://cdn.test/source.mp4');
    expect(result.playbackPath).toBe('videos/source.mp4');
  });

  it('requires configured ffmpeg and ffprobe binaries before downloading source media', async () => {
    process.env.VIDEO_TRANSCODING_ENABLED = 'true';

    const result = await processStoredVideoForAdaptiveStreaming({
      bucket: 'course-videos',
      contentType: 'video/mp4',
      publicUrl: 'https://cdn.test/source.mp4',
      sizeBytes: 1024,
      sourcePath: 'videos/source.mp4',
      supabase,
    });

    expect(result.status).toBe('disabled');
    expect(result.reason).toContain('FFMPEG_PATH');
  });
});
