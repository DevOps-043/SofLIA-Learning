import { NextRequest, NextResponse } from 'next/server'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'

export const revalidate = 600

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID es requerido' },
      { status: 400 },
    )
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

    if (!apiKey) {
      return buildFallbackResponse(videoId)
    }

    const response = await fetchWithCircuitBreaker(
      'google-youtube',
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`,
    )

    if (!response.ok) {
      return buildFallbackResponse(videoId)
    }

    const data = await response.json() as {
      items?: Array<{
        snippet?: {
          title?: string
          thumbnails?: {
            maxres?: { url?: string }
            high?: { url?: string }
          }
        }
      }>
    }
    const video = data.items?.[0]

    if (!video?.snippet) {
      return buildFallbackResponse(videoId)
    }

    return withCacheHeaders(
      NextResponse.json({
        title: video.snippet.title || 'Video de YouTube',
        thumbnail: video.snippet.thumbnails?.maxres?.url
          || video.snippet.thumbnails?.high?.url
          || buildThumbnailUrl(videoId),
      }),
      cacheHeaders.semiStatic,
    )
  } catch {
    return buildFallbackResponse(videoId)
  }
}

function buildFallbackResponse(videoId: string) {
  return withCacheHeaders(
    NextResponse.json({
      title: 'Video de YouTube',
      thumbnail: buildThumbnailUrl(videoId),
    }),
    cacheHeaders.semiStatic,
  )
}

function buildThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}
