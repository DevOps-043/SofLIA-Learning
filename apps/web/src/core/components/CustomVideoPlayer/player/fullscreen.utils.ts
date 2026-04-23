export async function requestPlayerFullscreen(
  containerElement: HTMLDivElement,
  videoElement: HTMLVideoElement
) {
  if (containerElement.requestFullscreen) {
    await containerElement.requestFullscreen();
    return;
  }

  const webkitContainer = containerElement as HTMLDivElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };

  if (webkitContainer.webkitRequestFullscreen) {
    await webkitContainer.webkitRequestFullscreen();
    return;
  }

  const webkitVideo = videoElement as HTMLVideoElement & {
    webkitEnterFullscreen?: () => void;
  };
  webkitVideo.webkitEnterFullscreen?.();
}

export async function exitPlayerFullscreen(videoElement: HTMLVideoElement) {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }

  const webkitDocument = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
  };

  if (webkitDocument.webkitExitFullscreen) {
    await webkitDocument.webkitExitFullscreen();
    return;
  }

  const webkitVideo = videoElement as HTMLVideoElement & {
    webkitExitFullscreen?: () => void;
  };
  webkitVideo.webkitExitFullscreen?.();
}
