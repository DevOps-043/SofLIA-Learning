import { NextResponse } from 'next/server';

import { SessionService } from '@/features/auth/services/session.service';
import { createAdminClient } from '@/lib/supabase/admin';

import {
  assertUserCanAccessCourse,
  loadCourseIdBySlug,
  unauthorizedResponse,
} from '../../reading-audio-api.service';

export const runtime = 'nodejs';

// El audio de un asset es inmutable: el id se deriva de (source, idioma,
// content_hash, segmento), asi que regenerar el contenido produce un id NUEVO y
// por tanto una URL nueva. Esto hace seguro cachear de forma agresiva e
// `immutable` en el navegador (los seeks/replays se sirven desde cache local,
// sin volver al servidor) durante un dia.
const AUDIO_CACHE_CONTROL = 'private, max-age=86400, immutable';

type AssetRow = {
  bucket: string;
  content_type: string;
  storage_path: string;
};

/**
 * Codifica cada segmento del path conservando los separadores `/`, para
 * construir la URL del objeto en Storage sin romper la ruta.
 */
function encodeStoragePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string; slug: string }> },
) {
  const { assetId, slug } = await params;
  const supabase = createAdminClient();

  // La sesion y la resolucion del curso por slug son independientes entre si:
  // las lanzamos en paralelo para no encadenar dos round trips.
  const [user, courseId] = await Promise.all([
    SessionService.getCurrentUser(),
    loadCourseIdBySlug(supabase, slug),
  ]);

  if (!user) return unauthorizedResponse();
  if (!courseId) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  // El control de acceso al curso y la lectura del asset solo dependen de
  // courseId -> en paralelo. La pertenencia del asset al curso se valida en la
  // MISMA query via inner-join (asset.lesson_id -> course_lessons -> course_modules),
  // eliminando un round trip extra y cualquier IDOR entre cursos.
  const [canAccess, assetResult] = await Promise.all([
    assertUserCanAccessCourse(supabase, user.id, courseId),
    supabase
      .from('tts_reading_audio_assets')
      .select(
        'bucket, storage_path, content_type, course_lessons!inner(course_modules!inner(course_id))',
      )
      .eq('id', assetId)
      .eq('course_lessons.course_modules.course_id', courseId)
      .maybeSingle(),
  ]);

  if (!canAccess) {
    return NextResponse.json({ error: 'Audio no disponible' }, { status: 403 });
  }

  const { data: asset, error } = assetResult;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = asset as AssetRow | null;
  if (!row) {
    return NextResponse.json({ error: 'Audio no encontrado' }, { status: 404 });
  }

  // Revalidacion barata: si el navegador ya tiene el asset (inmutable), 304 sin
  // tocar Storage. Evita re-transferir bytes en replays/recargas a gran escala.
  const etag = `"${assetId}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { 'Cache-Control': AUDIO_CACHE_CONTROL, ETag: etag },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Storage no configurado' }, { status: 500 });
  }

  // Stream directo desde Storage en lugar de descargar el archivo completo a
  // memoria del proceso: bajo 1000 usuarios concurrentes el buffering por
  // request (Blob.arrayBuffer) presiona la memoria y arriesga OOM. Reenviamos el
  // header Range para que Storage responda 206 con SOLO los bytes pedidos (seek
  // barato) y canalizamos el cuerpo como stream (memoria ~constante por request).
  const rangeHeader = request.headers.get('range');
  const objectUrl = `${supabaseUrl}/storage/v1/object/${row.bucket}/${encodeStoragePath(
    row.storage_path,
  )}`;

  const upstream = await fetch(objectUrl, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      ...(rangeHeader ? { range: rangeHeader } : {}),
    },
    cache: 'no-store',
  });

  if (upstream.status !== 200 && upstream.status !== 206) {
    return NextResponse.json({ error: 'Audio no encontrado' }, { status: 404 });
  }

  const headers = new Headers();
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', AUDIO_CACHE_CONTROL);
  headers.set('ETag', etag);
  headers.set(
    'Content-Type',
    row.content_type || upstream.headers.get('content-type') || 'audio/mpeg',
  );
  // Propagamos longitud/rango tal cual los resuelve Storage para que el navegador
  // calcule la duracion y permita el scrub.
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);
  const contentRange = upstream.headers.get('content-range');
  if (contentRange) headers.set('Content-Range', contentRange);

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
