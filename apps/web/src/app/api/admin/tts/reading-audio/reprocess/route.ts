import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  reprocessReadingAudioJob,
  resetStuckGeneratingJobs,
  retryFailedReadingAudioJobs,
} from '@/core/services/tts/server/tts-reading-admin.service';

export const runtime = 'nodejs';

const schema = z.object({
  jobId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(500),
  resetStuck: z.boolean().optional().default(false),
  retryFailed: z.boolean().optional().default(false),
}).refine((value) => value.jobId || value.retryFailed || value.resetStuck, {
  message: 'Se requiere jobId, retryFailed o resetStuck',
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
    if (parsed.data.resetStuck) {
      const result = await resetStuckGeneratingJobs(parsed.data.limit);
      return NextResponse.json({ success: true, ...result });
    }

    if (parsed.data.retryFailed) {
      const result = await retryFailedReadingAudioJobs(parsed.data.limit);
      return NextResponse.json({ success: true, ...result });
    }

    await reprocessReadingAudioJob(parsed.data.jobId!);
    return NextResponse.json({ jobId: parsed.data.jobId, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error reprocesando audio TTS' },
      { status: 500 },
    );
  }
}
