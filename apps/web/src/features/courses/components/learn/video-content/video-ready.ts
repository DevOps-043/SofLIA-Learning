export function scheduleVideoRestore(
  videoElement: HTMLVideoElement,
  restoreProgress: () => Promise<void>,
) {
  if (videoElement.readyState >= 3) {
    void restoreProgress();
    return;
  }

  if (videoElement.readyState >= 1) {
    videoElement.addEventListener("canplay", () => void restoreProgress(), { once: true });
    return;
  }

  videoElement.addEventListener(
    "loadedmetadata",
    () => {
      if (videoElement.readyState >= 3) {
        void restoreProgress();
        return;
      }

      videoElement.addEventListener("canplay", () => void restoreProgress(), { once: true });
    },
    { once: true },
  );
}
