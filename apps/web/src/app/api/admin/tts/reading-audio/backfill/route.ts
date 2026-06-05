import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import { backfillReadingAudioJobs } from '@/core/services/tts/server/tts-reading-admin.service';

export const runtime = 'nodejs';

const schema = z.object({
  allPages: z.boolean().optional().default(false),
  language: z.enum(['all', 'es', 'en', 'pt']).optional().default('all'),
  limit: z.number().int().min(1).max(300).optional().default(100),
  offset: z.number().int().min(0).max(100_000).optional().default(0),
  resource: z.enum(['all', 'activities', 'lessons']).optional().default('all'),
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
    // Endpoint bounded by design: callers must paginate with `hasMore/nextOffset`.
    // Running every page in one serverless request is what caused 504s in prod.
    const result = await backfillReadingAudioJobs({ ...parsed.data, allPages: false });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en backfill TTS' },
      { status: 500 },
    );
  }
}
