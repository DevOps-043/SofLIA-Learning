import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import { cleanupNonTargetReadingAudioJobs } from '@/core/services/tts/server/tts-reading-admin.service';

export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await cleanupNonTargetReadingAudioJobs();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error limpiando cola TTS' },
      { status: 500 },
    );
  }
}
