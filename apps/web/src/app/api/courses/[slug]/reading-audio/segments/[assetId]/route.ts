import { NextResponse } from 'next/server';

import { SessionService } from '@/features/auth/services/session.service';
import { createAdminClient } from '@/lib/supabase/admin';

import {
  assertLessonBelongsToCourse,
  assertUserCanAccessCourse,
  loadCourseIdBySlug,
  unauthorizedResponse,
} from '../../reading-audio-api.service';

export const runtime = 'nodejs';

type AssetRow = {
  bucket: string;
  content_type: string;
  lesson_id: string | null;
  storage_path: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string; slug: string }> },
) {
  const user = await SessionService.getCurrentUser();
  if (!user) return unauthorizedResponse();

  const { assetId, slug } = await params;
  const supabase = createAdminClient();

  const courseId = await loadCourseIdBySlug(supabase, slug);
  if (!courseId) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }
  if (!(await assertUserCanAccessCourse(supabase, user.id, courseId))) {
    return NextResponse.json({ error: 'Audio no disponible' }, { status: 403 });
  }

  const { data: asset, error } = await supabase
    .from('tts_reading_audio_assets')
    .select('bucket, storage_path, content_type, lesson_id')
    .eq('id', assetId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = asset as AssetRow | null;
  if (!row?.lesson_id) {
    return NextResponse.json({ error: 'Audio no encontrado' }, { status: 404 });
  }

  const belongsToCourse = await assertLessonBelongsToCourse(supabase, courseId, row.lesson_id);
  if (!belongsToCourse) {
    return NextResponse.json({ error: 'Audio no disponible' }, { status: 404 });
  }

  const { data: audio, error: downloadError } = await supabase.storage
    .from(row.bucket)
    .download(row.storage_path);

  if (downloadError || !audio) {
    return NextResponse.json(
      { error: downloadError?.message ?? 'Audio no encontrado' },
      { status: 404 },
    );
  }

  const buffer = await audio.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      // Content-Length + Accept-Ranges let the browser resolve the clip duration up
      // front, which the player's seek bar needs to render and scrub reliably.
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
      'Content-Length': String(buffer.byteLength),
      'Content-Type': row.content_type || 'audio/mpeg',
    },
  });
}
