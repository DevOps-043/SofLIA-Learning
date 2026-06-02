import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  READABLE_AUDIO_SOURCE_KINDS,
  normalizeReadableAudioLanguage,
} from '@/core/services/tts/readable-audio';
import { ensureReadableAudioManifest } from '@/core/services/tts/server/readable-audio-assets.service';

export const dynamic = 'force-dynamic';

const manifestSchema = z.object({
  sourceKind: z.enum(READABLE_AUDIO_SOURCE_KINDS),
  sourceId: z.string().trim().min(1).max(160),
  language: z.string().trim().max(8).optional(),
  text: z.unknown(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = manifestSchema.parse(await request.json());
    const manifest = await ensureReadableAudioManifest({
      sourceKind: payload.sourceKind,
      sourceId: payload.sourceId,
      language: normalizeReadableAudioLanguage(payload.language),
      text: payload.text,
    });

    return NextResponse.json({ success: true, manifest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid readable audio manifest payload', issues: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unexpected readable audio manifest error' },
      { status: 500 },
    );
  }
}
