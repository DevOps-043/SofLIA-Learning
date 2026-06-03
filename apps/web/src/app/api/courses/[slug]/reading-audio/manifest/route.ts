import { NextRequest, NextResponse } from 'next/server';

import { SessionService } from '@/features/auth/services/session.service';
import { createAdminClient } from '@/lib/supabase/admin';

import {
  loadCourseIdBySlug,
  normalizeReadingAudioLanguage,
  normalizeSourceType,
  assertUserCanAccessCourse,
  resolveReadingAudioSource,
  unauthorizedResponse,
} from '../reading-audio-api.service';

export const runtime = 'nodejs';

type SegmentRow = {
  byte_length: number | null;
  content_type: string;
  id: string;
  segment_index: number;
};

type ProgressRow = {
  completed: boolean;
  segment_index: number;
  segment_time_seconds: number | string;
};

function buildSegmentUrl(slug: string, assetId: string) {
  return `/api/courses/${encodeURIComponent(slug)}/reading-audio/segments/${assetId}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await SessionService.getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const lessonId = searchParams.get('lessonId');
  const sourceId = searchParams.get('sourceId');
  const sourceType = normalizeSourceType(searchParams.get('sourceType'));
  const requestedLanguage = normalizeReadingAudioLanguage(searchParams.get('language'));

  if (!lessonId || !sourceId || !sourceType) {
    return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const courseId = await loadCourseIdBySlug(supabase, slug);
  if (!courseId) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }
  if (!(await assertUserCanAccessCourse(supabase, user.id, courseId))) {
    return NextResponse.json({ error: 'Audio no disponible' }, { status: 403 });
  }

  const source = await resolveReadingAudioSource({
    courseId,
    language: requestedLanguage,
    lessonId,
    sourceId,
    sourceType,
    supabase,
  });

  if (!source) {
    return NextResponse.json({ error: 'Fuente de audio no encontrada' }, { status: 404 });
  }

  const { data: assets, error: assetsError } = await supabase
    .from('tts_reading_audio_assets')
    .select('id, segment_index, content_type, byte_length')
    .eq('source_type', source.sourceType)
    .eq('source_id', source.sourceId)
    .eq('language', source.language)
    .eq('content_hash', source.contentHash)
    .order('segment_index', { ascending: true });

  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  const { data: progress } = await supabase
    .from('user_reading_audio_progress')
    .select('segment_index, segment_time_seconds, completed')
    .eq('user_id', user.id)
    .eq('source_type', source.sourceType)
    .eq('source_id', source.sourceId)
    .eq('language', source.language)
    .eq('content_hash', source.contentHash)
    .maybeSingle();

  const rows = (assets ?? []) as SegmentRow[];
  const ready = source.expectedSegments > 0 && rows.length >= source.expectedSegments;
  const progressRow = progress as ProgressRow | null;

  return NextResponse.json({
    contentHash: source.contentHash,
    expectedSegments: source.expectedSegments,
    language: source.language,
    lessonId: source.lessonId,
    progress: {
      completed: progressRow?.completed ?? false,
      segmentIndex: progressRow?.segment_index ?? 0,
      segmentTimeSeconds: Number(progressRow?.segment_time_seconds ?? 0),
    },
    requestedLanguage,
    segments: ready
      ? rows.map((asset) => ({
          byteLength: asset.byte_length,
          contentType: asset.content_type,
          id: asset.id,
          segmentIndex: asset.segment_index,
          url: buildSegmentUrl(slug, asset.id),
        }))
      : [],
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    status: ready ? 'ready' : 'pending',
  });
}
