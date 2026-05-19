import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { logger } from '@/lib/utils/logger';

import { adminVideoDurationSchema, type AdminVideoDurationBody } from './schema';

function readDurationFromPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object' || !('duration' in payload)) {
    return null;
  }

  const duration = (payload as { duration?: unknown }).duration;
  return typeof duration === 'number' && Number.isFinite(duration)
    ? Math.floor(duration)
    : null;
}

async function handlePost(_request: NextRequest, body: AdminVideoDurationBody) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { provider, videoIdOrUrl } = body;
    let duration: number | null = null;

    if (provider === 'youtube') {
      let videoId = videoIdOrUrl;
      if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
        const match = videoIdOrUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (match?.[1]) {
          videoId = match[1];
        }
      }

      if (videoId) {
        duration = null;
      }
    } else if (provider === 'vimeo') {
      let videoId = videoIdOrUrl;
      if (videoIdOrUrl.includes('vimeo.com')) {
        const match = videoIdOrUrl.match(/vimeo\.com\/(\d+)/);
        if (match?.[1]) {
          videoId = match[1];
        }
      }

      if (videoId) {
        try {
          const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}`;
          const response = await fetchWithCircuitBreaker('vimeo-oembed', oembedUrl);

          if (response.ok) {
            const payload: unknown = await response.json();
            duration = readDurationFromPayload(payload);
          }
        } catch (error) {
          logger.warn('Unable to fetch Vimeo duration.', { provider, error });
        }
      }
    } else {
      duration = null;
    }

    return NextResponse.json({ duration });
  } catch (error) {
    logger.error('Error detecting admin video duration.', error);
    return apiError(
      'ADMIN_VIDEO_DURATION_DETECTION_FAILED',
      'Error al detectar duracion del video.',
      500,
    );
  }
}

export const POST = withZodBody(adminVideoDurationSchema, handlePost);
