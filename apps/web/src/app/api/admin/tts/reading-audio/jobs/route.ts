import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  listReadingAudioJobs,
  type ReadingAudioJobStatus,
} from '@/core/services/tts/server/tts-reading-admin.service';
import type {
  ReadingAudioLanguage,
  ReadingAudioSourceType,
} from '@/core/services/tts/server/tts-reading-pregeneration.service';

export const runtime = 'nodejs';

const STATUSES = new Set(['pending', 'generating', 'ready', 'failed', 'all']);
const LANGUAGES = new Set(['es', 'en', 'pt', 'all']);
const SOURCE_TYPES = new Set([
  'activity_reading',
  'material_reading',
  'lesson_transcript',
  'lesson_summary',
  'all',
]);

function readPositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const params = request.nextUrl.searchParams;
  const status = params.get('status') || 'all';
  const language = params.get('language') || 'all';
  const sourceType = params.get('sourceType') || 'all';

  if (!STATUSES.has(status) || !LANGUAGES.has(language) || !SOURCE_TYPES.has(sourceType)) {
    return NextResponse.json({ error: 'Filtros invalidos' }, { status: 400 });
  }

  try {
    const result = await listReadingAudioJobs({
      language: language as ReadingAudioLanguage | 'all',
      limit: readPositiveInt(params.get('limit'), 100, 300),
      offset: readPositiveInt(params.get('offset'), 0, 10_000),
      sourceType: sourceType as ReadingAudioSourceType | 'all',
      status: status as ReadingAudioJobStatus | 'all',
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al listar jobs' },
      { status: 500 },
    );
  }
}
