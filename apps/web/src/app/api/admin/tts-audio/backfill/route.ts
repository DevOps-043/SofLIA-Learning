import { NextResponse } from 'next/server';

import { enqueueReadableAudioBackfill } from '@/core/services/tts/server/readable-audio-assets.service';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await enqueueReadableAudioBackfill();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Error enqueueing TTS audio backfill:', error);

    return NextResponse.json(
      { success: false, error: 'Error enqueueing TTS audio backfill' },
      { status: 500 },
    );
  }
}
