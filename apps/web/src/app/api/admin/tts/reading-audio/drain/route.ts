import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import { drainReadingAudioQueue } from '@/core/services/tts/server/tts-reading-admin.service';

export const runtime = 'nodejs';

const schema = z.object({
  limit: z.number().int().min(1).max(1).optional().default(1),
});

async function readBody(request: NextRequest) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalido', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await drainReadingAudioQueue(parsed.data.limit);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error procesando cola TTS' },
      { status: 500 },
    );
  }
}
