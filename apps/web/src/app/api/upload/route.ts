import { NextRequest, NextResponse } from 'next/server';

// Aumentar el límite de body para permitir subir videos de hasta 500 MB
// Para App Router (Next.js 14+) se configura mediante maxDuration en vercel.json
// o aumentando el límite en next.config.js. En desarrollo local no hay límite.
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { 
  sanitizePath, 
  generateSafeFileName,
} from '@/lib/upload/validation';
import {
  INTRO_VIDEO_MAX_SIZE_BYTES,
  VIDEO_ASSET_CACHE_CONTROL,
  isStreamableVideoMimeType,
} from '@/lib/media/video-upload-policy';
import { processStoredVideoForAdaptiveStreaming } from '@/lib/media/server/adaptive-video-transcoding.server';

export const runtime = 'nodejs';

const DEFAULT_ASSET_CACHE_CONTROL = '3600';

export async function POST(request: NextRequest) {
  try {
    // Cliente con service role key para bypass de RLS (dentro de la función para evitar error en build)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string || '';

    // ✅ Validación 1: Archivo presente
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // ✅ Validación 2: Bucket presente
    if (!bucket) {
      return NextResponse.json({ error: 'No se proporcionó bucket' }, { status: 400 });
    }

    // Validar tamaño y tipo según el bucket
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    // Validaciones especificas para el bucket "intro-videos" (videos cortos, 100MB)
    if (bucket === 'intro-videos') {
      if (!isStreamableVideoMimeType(file.type)) {
        return NextResponse.json(
          { error: 'El bucket "intro-videos" solo acepta videos MP4 o WebM' },
          { status: 400 }
        );
      }

      if (file.size > INTRO_VIDEO_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'El video introductorio es demasiado grande. Máximo 100MB' },
          { status: 400 }
        );
      }
    } else if (bucket === 'courses') {
      const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'El bucket "courses" solo acepta imágenes (PNG, JPEG, JPG, GIF)' },
          { status: 400 }
        );
      }
      const maxSize = 8 * 1024 * 1024; // 8MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'El archivo es demasiado grande. Máximo 8MB para el bucket "courses"' },
          { status: 400 }
        );
      }
    } else {
      // Validación para otros buckets
      const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 500MB para videos, 10MB para otros
      if (file.size > maxSize) {
        return NextResponse.json(
          { 
            error: `El archivo es demasiado grande. Máximo ${isVideo ? '500MB' : '10MB'}` 
          }, 
          { status: 400 }
        );
      }
    }

    // Sanitizar el folder si existe
    const sanitizedFolder = folder ? sanitizePath(folder) : '';
    
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = generateSafeFileName(file.name, fileExt || '');
    const filePath = sanitizedFolder ? `${sanitizedFolder}/${fileName}` : fileName;

    // Subir archivo usando service role key
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: isStreamableVideoMimeType(file.type)
          ? VIDEO_ASSET_CACHE_CONTROL
          : DEFAULT_ASSET_CACHE_CONTROL,
        upsert: false
      });

    if (error) {
      logger.error('Error uploading file to Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Log de seguridad: Upload completado
    logger.info('File uploaded successfully', {
      fileName: fileName,
      filePath: filePath,
      bucket: bucket
    });

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    const adaptiveResult = bucket === 'intro-videos'
      ? await processStoredVideoForAdaptiveStreaming({
          bucket,
          contentType: file.type,
          publicUrl: urlData.publicUrl,
          sizeBytes: file.size,
          sourcePath: filePath,
          supabase,
        })
      : null;

    return NextResponse.json({
      success: true,
      adaptive: adaptiveResult,
      url: adaptiveResult?.playbackUrl ?? urlData.publicUrl,
      path: adaptiveResult?.playbackPath ?? filePath,
      sourcePath: filePath,
      sourceUrl: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      // ✅ Información adicional de seguridad
      validation: {
        sanitized: sanitizedFolder !== folder,
        bucket: bucket,
        maxSizeAllowed: bucket === 'intro-videos'
          ? '100MB'
          : bucket === 'courses'
            ? '8MB'
            : (isVideo ? '500MB' : '10MB')
      }
    });

  } catch (error) {
    logger.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
