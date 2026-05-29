import { describe, expect, it } from 'vitest';

import {
  buildSafeResumeCheckpoint,
  normalizeVideoProgress,
  VIDEO_COMPLETION_PERCENT,
} from '../progress-security';

describe('video progress security', () => {
  it('keeps max progress monotonic without accepting large forward jumps', () => {
    const normalized = normalizeVideoProgress({
      checkpoint: 90,
      currentMaxReached: 12,
      incomingMaxReached: 90,
      totalDuration: 100,
    });

    expect(normalized.safeMaxReached).toBe(20);
    expect(normalized.safeCheckpoint).toBe(20);
    expect(normalized.videoProgressPercentage).toBe(20);
  });

  it('does not decrease an existing max progress value', () => {
    const normalized = normalizeVideoProgress({
      checkpoint: 30,
      currentMaxReached: 50,
      incomingMaxReached: 30,
      totalDuration: 100,
    });

    expect(normalized.safeMaxReached).toBe(50);
    expect(normalized.safeCheckpoint).toBe(30);
  });

  it('restores incomplete videos only up to the trusted max reached point', () => {
    expect(
      buildSafeResumeCheckpoint({
        checkpoint: 90,
        completionPercentage: 40,
        isCompleted: false,
        maxReached: 42,
      }),
    ).toBe(42);
  });

  it('allows full restore after the video is completed', () => {
    expect(
      buildSafeResumeCheckpoint({
        checkpoint: 90,
        completionPercentage: VIDEO_COMPLETION_PERCENT,
        isCompleted: false,
        maxReached: 42,
      }),
    ).toBe(90);
  });
});
