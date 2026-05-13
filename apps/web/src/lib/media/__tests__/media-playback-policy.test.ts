import { describe, expect, it } from 'vitest';
import {
  getNativeVideoPreload,
  resolveMediaPlaybackPolicy,
  shouldUseEmbedFacade,
} from '../media-playback-policy';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

describe('media-playback-policy', () => {
  it('requires user interaction and metadata preload for iPhone lesson videos', () => {
    const policy = resolveMediaPlaybackPolicy(
      {
        userAgent: IPHONE_UA,
        viewportWidth: 430,
      },
      'lesson'
    );

    expect(policy.isIOSLike).toBe(true);
    expect(policy.requiresUserGesture).toBe(true);
    expect(policy.allowAutoplay).toBe(false);
    expect(getNativeVideoPreload(policy)).toBe('metadata');
    expect(policy.pauseWhenOutsideViewport).toBe(false);
    expect(shouldUseEmbedFacade(policy)).toBe(true);
  });

  it('uses auto preload for desktop lesson videos and immediate embeds', () => {
    const policy = resolveMediaPlaybackPolicy(
      {
        effectiveType: '4g',
        saveData: false,
        userAgent: DESKTOP_CHROME_UA,
        viewportWidth: 1440,
      },
      'lesson'
    );

    expect(policy.requiresUserGesture).toBe(false);
    expect(policy.allowAutoplay).toBe(true);
    expect(policy.nativeVideoPreload).toBe('auto');
    expect(policy.pauseWhenOutsideViewport).toBe(false);
    expect(policy.shouldUseEmbedFacade).toBe(false);
  });

  it('disables tour prefetch and autoplay on save-data or slow connections', () => {
    const saveDataPolicy = resolveMediaPlaybackPolicy(
      {
        saveData: true,
        userAgent: DESKTOP_CHROME_UA,
        viewportWidth: 1440,
      },
      'tour'
    );
    const slowConnectionPolicy = resolveMediaPlaybackPolicy(
      {
        effectiveType: '3g',
        userAgent: DESKTOP_CHROME_UA,
        viewportWidth: 1440,
      },
      'tour'
    );

    expect(saveDataPolicy.allowAutoplay).toBe(false);
    expect(saveDataPolicy.shouldPrefetchVideo).toBe(false);
    expect(saveDataPolicy.nativeVideoPreload).toBe('none');
    expect(slowConnectionPolicy.shouldPrefetchVideo).toBe(false);
    expect(slowConnectionPolicy.nativeVideoPreload).toBe('metadata');
  });

  it('uses auto preload for desktop tour videos without speculative prefetch', () => {
    const policy = resolveMediaPlaybackPolicy(
      {
        effectiveType: '4g',
        saveData: false,
        userAgent: DESKTOP_CHROME_UA,
        viewportWidth: 1440,
      },
      'tour'
    );

    expect(policy.allowAutoplay).toBe(true);
    expect(policy.nativeVideoPreload).toBe('auto');
    expect(policy.pauseWhenOutsideViewport).toBe(false);
    expect(policy.shouldPrefetchVideo).toBe(false);
  });

  it('uses embed facades for attachments even on unconstrained desktop', () => {
    const policy = resolveMediaPlaybackPolicy(
      {
        effectiveType: '4g',
        userAgent: DESKTOP_CHROME_UA,
        viewportWidth: 1440,
      },
      'attachment'
    );

    expect(policy.shouldUseEmbedFacade).toBe(true);
    expect(policy.nativeVideoPreload).toBe('metadata');
    expect(policy.pauseWhenOutsideViewport).toBe(true);
  });
});
