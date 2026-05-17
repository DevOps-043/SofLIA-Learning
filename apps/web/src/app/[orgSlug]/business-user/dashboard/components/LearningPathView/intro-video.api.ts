import type { IntroVideoResponse, IntroVideoState } from './types'

export function getIntroFallback(isLoading: boolean): IntroVideoState {
  return {
    introVideoUrl: null,
    watched: false,
    loading: isLoading,
    showPlayer: false,
  }
}

export async function fetchIntroVideoState(
  orgSlug: string,
  pathId: string,
): Promise<[string, IntroVideoState]> {
  try {
    const response = await fetch(
      `/api/${encodeURIComponent(orgSlug)}/business-user/lp/${encodeURIComponent(pathId)}/intro-video`,
      { cache: 'no-store' },
    )
    const data = (await response.json()) as IntroVideoResponse

    if (!response.ok || data.success === false) {
      return [pathId, getIntroFallback(false)]
    }

    return [
      pathId,
      {
        introVideoUrl: data.introVideoUrl ?? null,
        watched: Boolean(data.watched),
        loading: false,
        showPlayer: false,
      },
    ]
  } catch {
    return [pathId, getIntroFallback(false)]
  }
}

export function markIntroVideoWatched(orgSlug: string, pathId: string) {
  return fetch(
    `/api/${encodeURIComponent(orgSlug)}/business-user/lp/${encodeURIComponent(pathId)}/intro-video`,
    { method: 'POST' },
  )
}
