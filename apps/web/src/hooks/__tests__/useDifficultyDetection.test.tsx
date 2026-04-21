// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDifficultyDetection } from '../useDifficultyDetection';
import { sessionRecorder } from '../../lib/rrweb/session-recorder';
import { evaluateRecordingGate } from '../../lib/rrweb/recording-gate';

vi.mock('../../lib/rrweb/session-recorder', () => ({
  sessionRecorder: {
    captureSnapshot: vi.fn(),
    isActive: vi.fn(),
    isPaused: vi.fn(),
  },
}));

vi.mock('../../lib/rrweb/recording-gate', () => ({
  evaluateRecordingGate: vi.fn(),
}));

const mockedSessionRecorder = vi.mocked(sessionRecorder);
const mockedEvaluateRecordingGate = vi.mocked(evaluateRecordingGate);

describe('useDifficultyDetection recording gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockedSessionRecorder.isActive.mockReturnValue(true);
    mockedSessionRecorder.isPaused.mockReturnValue(false);
    mockedSessionRecorder.captureSnapshot.mockReturnValue(null);
    mockedEvaluateRecordingGate.mockReturnValue({
      allowed: true,
      reason: 'allowed',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not poll or capture snapshots when the recording gate denies the environment', () => {
    mockedEvaluateRecordingGate.mockReturnValue({
      allowed: false,
      reason: 'mobile-viewport',
    });

    const { result } = renderHook(() =>
      useDifficultyDetection({ enabled: true, checkInterval: 1000 })
    );

    vi.advanceTimersByTime(3000);

    expect(result.current.isActive).toBe(false);
    expect(mockedSessionRecorder.captureSnapshot).not.toHaveBeenCalled();
  });

  it('does not capture snapshots when rrweb is inactive or paused', () => {
    mockedSessionRecorder.isActive.mockReturnValue(false);

    renderHook(() =>
      useDifficultyDetection({ enabled: true, checkInterval: 1000 })
    );

    vi.advanceTimersByTime(3000);

    expect(mockedSessionRecorder.captureSnapshot).not.toHaveBeenCalled();
  });
});
