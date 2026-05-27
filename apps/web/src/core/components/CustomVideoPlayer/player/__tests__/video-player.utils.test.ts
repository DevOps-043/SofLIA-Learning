import { describe, expect, it } from 'vitest';
import {
  calculateProgressTime,
  calculateVolumeLevel,
  clampLockedSeekTarget,
  clampPlaybackTime,
  clampUnitInterval,
  formatVideoTime,
  isForwardSeekBlocked,
  shouldPauseDetachedPiP,
} from '../video-player.utils';

describe('video-player.utils', () => {
  it('clamps percentages into the unit interval', () => {
    expect(clampUnitInterval(-1)).toBe(0);
    expect(clampUnitInterval(0.5)).toBe(0.5);
    expect(clampUnitInterval(2)).toBe(1);
  });

  it('calculates current playback time from pointer position', () => {
    expect(calculateProgressTime(150, 100, 200, 120)).toBe(30);
    expect(calculateProgressTime(50, 100, 200, 120)).toBe(0);
    expect(calculateProgressTime(400, 100, 200, 120)).toBe(120);
  });

  it('calculates volume level from vertical pointer position', () => {
    expect(calculateVolumeLevel(150, 200, 100)).toBe(0.5);
    expect(calculateVolumeLevel(250, 200, 100)).toBe(0);
    expect(calculateVolumeLevel(50, 200, 100)).toBe(1);
  });

  it('clamps skip operations within the video duration', () => {
    expect(clampPlaybackTime(20, 120, 15)).toBe(35);
    expect(clampPlaybackTime(5, 120, -20)).toBe(0);
    expect(clampPlaybackTime(119, 120, 10)).toBe(120);
  });

  it('clamps locked forward seeks to the maximum watched time', () => {
    expect(clampLockedSeekTarget(80, 12, 100)).toBe(12);
    expect(clampLockedSeekTarget(12.5, 12, 100)).toBe(12.5);
    expect(clampLockedSeekTarget(-5, 12, 100)).toBe(0);
  });

  it('detects forward seeks beyond the lock tolerance', () => {
    expect(isForwardSeekBlocked(20, 12)).toBe(true);
    expect(isForwardSeekBlocked(12.5, 12)).toBe(false);
    expect(isForwardSeekBlocked(8, 12)).toBe(false);
  });

  it('formats video times as mm:ss', () => {
    expect(formatVideoTime(65)).toBe('1:05');
    expect(formatVideoTime(Number.NaN)).toBe('0:00');
  });

  it('detects when a detached PiP video should be paused', () => {
    expect(shouldPauseDetachedPiP(false, false)).toBe(true);
    expect(shouldPauseDetachedPiP(true, false)).toBe(false);
    expect(shouldPauseDetachedPiP(false, true)).toBe(false);
  });
});
