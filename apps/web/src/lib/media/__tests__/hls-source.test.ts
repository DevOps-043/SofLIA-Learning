import { describe, expect, it } from 'vitest';
import { HLS_MANIFEST_MIME_TYPE, isHlsManifestUrl } from '../hls-source';

describe('hls-source', () => {
  it('detects HLS manifests with optional query params', () => {
    expect(isHlsManifestUrl('https://cdn.test/video/master.m3u8')).toBe(true);
    expect(isHlsManifestUrl('https://cdn.test/video/master.m3u8?v=1')).toBe(true);
    expect(isHlsManifestUrl('https://cdn.test/video/source.mp4')).toBe(false);
    expect(HLS_MANIFEST_MIME_TYPE).toBe('application/x-mpegURL');
  });
});
