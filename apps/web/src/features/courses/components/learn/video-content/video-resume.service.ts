type VideoResumeApiResponse = {
  completionPercentage?: number;
  checkpointSeconds?: number;
  maxReachedSeconds?: number;
  playbackRate?: number;
};

interface VideoResumeScope {
  enrollmentId?: string | null;
  organizationId?: string | null;
}

function buildVideoResumeUrl(lessonId: string, scope?: VideoResumeScope) {
  const params = new URLSearchParams();

  if (scope?.organizationId) {
    params.set("orgId", scope.organizationId);
  }

  if (scope?.enrollmentId) {
    params.set("enrollmentId", scope.enrollmentId);
  }

  const query = params.toString();
  return `/api/video-tracking/resume/${lessonId}${query ? `?${query}` : ""}`;
}

export async function fetchVideoResumeData(lessonId: string, scope?: VideoResumeScope): Promise<{
  checkpointSeconds: number;
  playbackRate: number;
}> {
  try {
    const response = await fetch(buildVideoResumeUrl(lessonId, scope), {
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
