"use client";

import { useEffect } from "react";
import type { VideoPlayerContextValue } from "./video-content.types";

interface UseVideoAutoplayGuardsParams {
  lessonId?: string;
  suppressVideoPlayback: boolean;
  videoPlayerContext?: VideoPlayerContextValue | null;
}

export function useVideoAutoplayGuards({
  lessonId,
  suppressVideoPlayback,
  videoPlayerContext,
}: UseVideoAutoplayGuardsParams) {
  useEffect(() => {
    videoPlayerContext?.setShouldAutoPlay(false);
  }, [lessonId, videoPlayerContext]);

  useEffect(() => {
    if (!suppressVideoPlayback) return;

    videoPlayerContext?.setShouldAutoPlay(false);
    videoPlayerContext?.pauseAllVideos?.();
  }, [suppressVideoPlayback, videoPlayerContext]);
}
