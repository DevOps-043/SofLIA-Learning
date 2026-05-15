import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  COURSE_VIDEO_MAX_SIZE_BYTES,
  STREAMABLE_VIDEO_MIME_TYPES,
} from '@/lib/media/video-upload-policy';
import { dispatchTranscodingJob } from '@/lib/media/server/transcoding-dispatcher.server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  contentType: z.enum(STREAMABLE_VIDEO_MIME_TYPES),
  publicUrl: z.string().url(),
  size: z.number().int().positive().max(COURSE_VIDEO_MAX_SIZE_BYTES).optional(),
  sourcePath: z.string().min(1).max(600),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const result = await dispatchTranscodingJob({
      supabase,
      bucket: 'course-videos',
      contentType: parsed.data.contentType,
      sourceUrl: parsed.data.publicUrl,
      sizeBytes: parsed.data.size,
      sourcePath: parsed.data.sourcePath,
    });

    return NextResponse.json({
      success: true,
      jobId: result.jobId ?? null,
      transcoding: result.status,
      path: result.playbackPath,
      url: result.playbackUrl,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al procesar el video' },
      { status: 500 }
    );
  }
}
