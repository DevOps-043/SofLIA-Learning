export const NATIVE_VIDEO_BUFFERING_DELAY_MS = 700;
export const NATIVE_VIDEO_STALLED_DELAY_MS = 1200;

const HAVE_FUTURE_DATA_READY_STATE = 3;

type NativeVideoPlaybackState = Pick<
  HTMLMediaElement,
  'ended' | 'paused' | 'readyState'
>;

export function isNativeVideoWaitingForPlayableData(
  videoElement?: NativeVideoPlaybackState | null
): boolean {
  if (!videoElement) {
    return false;
  }

  return (
    !videoElement.paused &&
    !videoElement.ended &&
    videoElement.readyState < HAVE_FUTURE_DATA_READY_STATE
  );
}

export function hasNativeVideoPlayableData(
  videoElement?: Pick<HTMLMediaElement, 'readyState'> | null
): boolean {
  return Boolean(
    videoElement &&
      videoElement.readyState >= HAVE_FUTURE_DATA_READY_STATE
  );
}
