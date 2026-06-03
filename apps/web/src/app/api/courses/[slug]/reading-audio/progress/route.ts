import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { SessionService } from '@/features/auth/services/session.service';
import { createAdminClient } from '@/lib/supabase/admin';

import {
  assertUserCanAccessCourse,
  loadCourseIdBySlug,
  normalizeReadingAudioLanguage,
  normalizeSourceType,
  resolveReadingAudioSource,
  unauthorizedResponse,
} from '../reading-audio-api.service';

export const runtime = 'nodejs';

const progressSchema = z.object({
  completed: z.boolean().optional(),
  language: z.enum(['es', 'en', 'pt']).optional(),
  lessonId: z.string().uuid(),
  organizationId: z.string().uuid().nullable().optional(),
  segmentIndex: z.number().int().min(0),
  segmentTimeSeconds: z.number().min(0).max(86_400),
  sourceId: z.string().uuid(),
  sourceType: z.enum([
    'activity_reading',
    'lesson_transcript',
    'lesson_summary',
  ]),
});

type ProgressRow = {
  completed: boolean;
  segment_index: number;
  segment_time_seconds: number | string;
};

async function resolveRequestSource(
  request: NextRequest,
  slug: string,
  userId: string,
  userInput?: z.infer<typeof progressSchema>,
) {
  const searchParams = request.nextUrl.searchParams;
  const lessonId = userInput?.lessonId ?? searchParams.get('lessonId');
  const sourceId = userInput?.sourceId ?? searchParams.get('sourceId');
  const sourceType = userInput?.sourceType ?? normalizeSourceType(searchParams.get('sourceType'));
  const language = normalizeReadingAudioLanguage(userInput?.language ?? searchParams.get('language'));

  if (!lessonId || !sourceId || !sourceType) {
    return { error: NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 }) };
  }

  const supabase = createAdminClient();
  const courseId = await loadCourseIdBySlug(supabase, slug);
  if (!courseId) {
    return { error: NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 }) };
  }
  if (!(await assertUserCanAccessCourse(supabase, userId, courseId))) {
    return { error: NextResponse.json({ error: 'Audio no disponible' }, { status: 403 }) };
  }

  const source = await resolveReadingAudioSource({
    courseId,
    language,
    lessonId,
    sourceId,
    sourceType,
    supabase,
  });

  if (!source) {
    return { error: NextResponse.json({ error: 'Fuente de audio no encontrada' }, { status: 404 }) };
  }

  return { source, supabase };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await SessionService.getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { slug } = await params;
  const resolved = await resolveRequestSource(request, slug, user.id);
  if (resolved.error) return resolved.error;

  const { data, error } = await resolved.supabase
    .from('user_reading_audio_progress')
    .select('segment_index, segment_time_seconds, completed')
    .eq('user_id', user.id)
    .eq('source_type', resolved.source.sourceType)
    .eq('source_id', resolved.source.sourceId)
    .eq('language', resolved.source.language)
    .eq('content_hash', resolved.source.contentHash)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const progress = data as ProgressRow | null;
  return NextResponse.json({
    completed: progress?.completed ?? false,
    contentHash: resolved.source.contentHash,
    language: resolved.source.language,
    segmentIndex: progress?.segment_index ?? 0,
    segmentTimeSeconds: Number(progress?.segment_time_seconds ?? 0),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await SessionService.getCurrentUser();
  if (!user) return unauthorizedResponse();

  const body = progressSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: 'Payload invalido', details: body.error.flatten() }, { status: 400 });
  }

  const { slug } = await params;
  const resolved = await resolveRequestSource(request, slug, user.id, body.data);
  if (resolved.error) return resolved.error;

  const { error } = await resolved.supabase
    .from('user_reading_audio_progress')
    .upsert(
      {
        completed: body.data.completed ?? false,
        content_hash: resolved.source.contentHash,
        language: resolved.source.language,
        lesson_id: resolved.source.lessonId,
        organization_id: body.data.organizationId ?? null,
        segment_index: body.data.segmentIndex,
        segment_time_seconds: body.data.segmentTimeSeconds,
        source_id: resolved.source.sourceId,
        source_type: resolved.source.sourceType,
        updated_at: new Date().toISOString(),
        user_id: user.id,
      },
      { onConflict: 'user_id,source_type,source_id,language,content_hash' },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    completed: body.data.completed ?? false,
    contentHash: resolved.source.contentHash,
    language: resolved.source.language,
    segmentIndex: body.data.segmentIndex,
    segmentTimeSeconds: body.data.segmentTimeSeconds,
    success: true,
  });
}
