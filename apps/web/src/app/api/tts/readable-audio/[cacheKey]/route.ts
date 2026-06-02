import { NextResponse } from 'next/server';

import { resolveReadableAudioSegment } from '@/core/services/tts/server/readable-audio-assets.service';

export const dynamic = 'force-dynamic';

const TTS_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export async function GET(
  _request: Request,
  { params }: { params: { cacheKey: string } },
) {
  const cacheKey = decodeURIComponent(params.cacheKey);
  const result = await resolveReadableAudioSegment(cacheKey);

  if (result.kind === 'error') {
    return NextResponse.json(result.body, { status: result.status });
  }

  return new NextResponse(result.bytes, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': TTS_CACHE_CONTROL,
      'X-TTS-Cache': result.cacheStatus,
    },
  });
}
