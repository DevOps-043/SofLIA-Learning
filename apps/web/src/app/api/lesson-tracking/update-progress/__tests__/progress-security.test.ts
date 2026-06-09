import { describe, expect, it } from 'vitest';

import {
  buildSafeResumeCheckpoint,
  computeAllowedForwardJumpSeconds,
  MAX_FORWARD_PROGRESS_JUMP_SECONDS,
  MAX_TRUSTED_ELAPSED_SECONDS,
  MAX_TRUSTED_PLAYBACK_RATE,
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

  it('allows the max to advance in proportion to elapsed real time and rate', () => {
    // 10s reales a 1x => avance permitido = 8 (colchón) + 10 * 1 * 1.25 = 20.5
    const normalized = normalizeVideoProgress({
      checkpoint: 32,
      currentMaxReached: 12,
      incomingMaxReached: 32,
      totalDuration: 100,
      elapsedSeconds: 10,
      playbackRate: 1,
    });

    expect(normalized.safeMaxReached).toBe(32);
    expect(normalized.safeCheckpoint).toBe(32);
  });

  it('lets a continuously watched video reach completion via incremental flushes', () => {
    // Reproducción real flusheando cada ~5s: cada reporte cabe en el avance
    // permitido y el máximo sube hasta el final del video.
    let max = 0;
    for (let elapsedPoint = 5; elapsedPoint <= 100; elapsedPoint += 5) {
      const normalized = normalizeVideoProgress({
        checkpoint: elapsedPoint,
        currentMaxReached: max,
        incomingMaxReached: elapsedPoint,
        totalDuration: 100,
        elapsedSeconds: 5,
        playbackRate: 1,
      });
      max = normalized.safeMaxReached;
    }

    expect(max).toBe(100);
  });

  it('caps the trusted elapsed window to prevent unlocking the full video in one request', () => {
    // Una sola petición tras una hora de inactividad NO debe desbloquear todo.
    const normalized = normalizeVideoProgress({
      checkpoint: 600,
      currentMaxReached: 0,
      incomingMaxReached: 600,
      totalDuration: 600,
      elapsedSeconds: 3600,
      playbackRate: 1,
    });

    const maxAllowed =
      MAX_FORWARD_PROGRESS_JUMP_SECONDS + MAX_TRUSTED_ELAPSED_SECONDS * 1 * 1.25;
    expect(normalized.safeMaxReached).toBeLessThanOrEqual(Math.floor(maxAllowed));
    expect(normalized.safeMaxReached).toBeLessThan(600);
  });

  it('clamps a forged high playbackRate to the trusted maximum', () => {
    const forged = computeAllowedForwardJumpSeconds(10, 16);
    const trusted = computeAllowedForwardJumpSeconds(10, MAX_TRUSTED_PLAYBACK_RATE);

    expect(forged).toBe(trusted);
  });

  it('falls back to the fixed buffer when no elapsed time is provided', () => {
    expect(computeAllowedForwardJumpSeconds(undefined, 1)).toBe(
      MAX_FORWARD_PROGRESS_JUMP_SECONDS,
    );
  });

  it('marks full completion on the terminal "ended" event regardless of rate cap', () => {
    // Video visto completo a velocidad alta: el flush previo dejó el máximo por
    // debajo del final, pero `reachedEnd` permite registrar la duración total.
    const normalized = normalizeVideoProgress({
      checkpoint: 100,
      currentMaxReached: 80,
      incomingMaxReached: 100,
      totalDuration: 100,
      elapsedSeconds: 1,
      playbackRate: 16,
      reachedEnd: true,
    });

    expect(normalized.safeMaxReached).toBe(100);
    expect(normalized.videoProgressPercentage).toBe(100);
  });

  it('still never decreases the max even on the terminal event', () => {
    // Un `ended` con un máximo reportado menor (p. ej. tras un seek) no borra el
    // progreso real ya alcanzado: protege el "reanudar a medias".
    const normalized = normalizeVideoProgress({
      checkpoint: 10,
      currentMaxReached: 70,
      incomingMaxReached: 40,
      totalDuration: 100,
      reachedEnd: true,
    });

    expect(normalized.safeMaxReached).toBe(70);
    expect(normalized.safeCheckpoint).toBe(10);
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
