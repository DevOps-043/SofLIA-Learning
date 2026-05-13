import { describe, expect, it } from 'vitest';
import {
  hasNativeVideoPlayableData,
  isNativeVideoWaitingForPlayableData,
} from '../native-video-buffering';

describe('native-video-buffering', () => {
  it('shows buffering only when an active video is waiting for future data', () => {
    expect(
      isNativeVideoWaitingForPlayableData({
        ended: false,
        paused: false,
        readyState: 2,
      } as HTMLMediaElement)
    ).toBe(true);

    expect(
      isNativeVideoWaitingForPlayableData({
        ended: false,
        paused: false,
        readyState: 3,
      } as HTMLMediaElement)
    ).toBe(false);
  });

  it('does not show buffering for paused or ended videos', () => {
    expect(
      isNativeVideoWaitingForPlayableData({
        ended: false,
        paused: true,
        readyState: 0,
      } as HTMLMediaElement)
    ).toBe(false);

    expect(
      isNativeVideoWaitingForPlayableData({
        ended: true,
        paused: false,
        readyState: 0,
      } as HTMLMediaElement)
    ).toBe(false);
  });

  it('detects when enough future data is available', () => {
    expect(hasNativeVideoPlayableData({ readyState: 2 } as HTMLMediaElement)).toBe(
      false
    );
    expect(hasNativeVideoPlayableData({ readyState: 3 } as HTMLMediaElement)).toBe(
      true
    );
  });
});
