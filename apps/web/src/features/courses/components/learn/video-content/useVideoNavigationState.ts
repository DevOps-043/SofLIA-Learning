interface UseVideoNavigationStateParams {
  getNextLesson: () => { video_provider?: string | null; video_provider_id?: string | null } | null;
  getPreviousLesson: () => { video_provider?: string | null; video_provider_id?: string | null } | null;
}

export function useVideoNavigationState({
  getNextLesson,
  getPreviousLesson,
}: UseVideoNavigationStateParams) {
  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();
  const hasPreviousLesson = previousLesson !== null;
  const hasNextLesson = nextLesson !== null;

  return {
    hasNextLesson,
    hasNextVideo: Boolean(hasNextLesson && nextLesson?.video_provider && nextLesson?.video_provider_id),
    hasPreviousVideo: Boolean(
      hasPreviousLesson && previousLesson?.video_provider && previousLesson?.video_provider_id,
    ),
    isLastLesson: !hasNextLesson,
  };
}
