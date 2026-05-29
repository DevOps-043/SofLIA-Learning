export const VIDEO_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const LOCKED_SEEK_EPSILON_SECONDS = 0.75;

export function clampUnitInterval(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function calculateProgressTime(
  clientX: number,
  rectLeft: number,
  rectWidth: number,
  duration: number
): number {
  if (rectWidth <= 0 || duration <= 0) {
    return 0;
  }

  return clampUnitInterval((clientX - rectLeft) / rectWidth) * duration;
}

export function calculateVolumeLevel(
  clientY: number,
  rectBottom: number,
  rectHeight: number
): number {
  if (rectHeight <= 0) {
    return 0;
  }

  return clampUnitInterval((rectBottom - clientY) / rectHeight);
}

export function clampPlaybackTime(
  currentTime: number,
  duration: number,
  deltaSeconds: number
): number {
  if (duration <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(duration, currentTime + deltaSeconds));
}

export function clampLockedSeekTarget(
  requestedTime: number,
  maxAllowedTime: number,
  duration: number
): number {
  const safeDuration = duration > 0 ? duration : Number.POSITIVE_INFINITY;
  const safeMaxAllowedTime = Math.max(0, Math.min(maxAllowedTime, safeDuration));

  if (requestedTime <= safeMaxAllowedTime + LOCKED_SEEK_EPSILON_SECONDS) {
    return Math.max(0, Math.min(requestedTime, safeDuration));
  }

  return safeMaxAllowedTime;
}

export function isForwardSeekBlocked(
  requestedTime: number,
  maxAllowedTime: number
): boolean {
  return requestedTime > maxAllowedTime + LOCKED_SEEK_EPSILON_SECONDS;
}

export function formatVideoTime(seconds: number): string {
  if (Number.isNaN(seconds)) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function shouldPauseDetachedPiP(
  isVideoVisible: boolean,
  isVideoPaused: boolean
): boolean {
  return !isVideoVisible && !isVideoPaused;
}
