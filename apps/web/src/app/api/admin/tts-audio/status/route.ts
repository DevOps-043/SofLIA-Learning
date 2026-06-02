import { NextResponse } from 'next/server';

import { getReadableAudioStatus } from '@/core/services/tts/server/readable-audio-assets.service';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const status = await getReadableAudioStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    logger.error('Error reading TTS audio status:', error);

    return NextResponse.json(
      { success: false, error: 'Error reading TTS audio status' },
      { status: 500 },
    );
  }
}
