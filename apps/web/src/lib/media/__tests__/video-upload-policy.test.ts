import { describe, expect, it } from 'vitest';
import {
  STREAMABLE_VIDEO_ACCEPT,
  VIDEO_ASSET_CACHE_CONTROL,
  isStreamableVideoExtension,
  isStreamableVideoMimeType,
} from '../video-upload-policy';

describe('video-upload-policy', () => {
  it('keeps upload formats limited to streamable browser video assets', () => {
    expect(STREAMABLE_VIDEO_ACCEPT).toBe('video/mp4,video/webm');
    expect(isStreamableVideoMimeType('video/mp4')).toBe(true);
    expect(isStreamableVideoMimeType('video/webm')).toBe(true);
    expect(isStreamableVideoMimeType('video/quicktime')).toBe(false);
    expect(isStreamableVideoMimeType('video/x-msvideo')).toBe(false);
  });

  it('supports long-lived immutable video cache control values', () => {
    expect(VIDEO_ASSET_CACHE_CONTROL).toBe('31536000');
    expect(isStreamableVideoExtension('mp4')).toBe(true);
    expect(isStreamableVideoExtension('MOV')).toBe(false);
  });
});
