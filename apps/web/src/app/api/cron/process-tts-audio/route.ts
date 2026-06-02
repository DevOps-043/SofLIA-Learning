import { NextResponse } from 'next/server';

import { processPendingReadableAudioAssets } from '@/core/services/tts/server/readable-audio-assets.service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
}

function readLimit(request: Request) {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get('limit') || 5);

  if (!Number.isFinite(rawLimit)) {
    return 5;
  }

  return Math.min(Math.max(Math.trunc(rawLimit), 1), 10);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processPendingReadableAudioAssets({ limit: readLimit(request) });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error processing TTS audio queue:', error);

    return NextResponse.json(
      { error: 'Error processing TTS audio queue' },
      { status: 500 },
    );
  }
}
