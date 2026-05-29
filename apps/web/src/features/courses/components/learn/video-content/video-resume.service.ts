type VideoResumeApiResponse = {
  completionPercentage?: number;
  checkpointSeconds?: number;
  maxReachedSeconds?: number;
  playbackRate?: number;
};

export async function fetchVideoResumeData(lessonId: string): Promise<{
  checkpointSeconds: number;
  playbackRate: number;
}> {
  try {
    const response = await fetch(`/api/video-tracking/resume/${lessonId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      return { checkpointSeconds: 0, playbackRate: 1 };
    }

    const data = (await response.json()) as VideoResumeApiResponse;

    return {
      checkpointSeconds: typeof data.checkpointSeconds === "number" ? data.checkpointSeconds : 0,
      playbackRate: typeof data.playbackRate === "number" && data.playbackRate > 0 ? data.playbackRate : 1,
    };
  } catch {
    return { checkpointSeconds: 0, playbackRate: 1 };
  }
}
